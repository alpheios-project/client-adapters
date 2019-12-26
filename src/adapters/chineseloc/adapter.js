/* eslint-disable no-unused-vars */
import BaseAdapter from '@/adapters/base-adapter'
import ChineseSource from '@/adapters/chineseloc/chinese-source/chinese-source.js'
import { ChineseLanguageModel, Lemma, Lexeme, Homonym, Feature, Definition } from 'alpheios-data-models'
import {
  MessagingService, WindowIframeDestination as Destination, CedictDestinationConfig as CedictConfig,
  CedictCharacterForms, RequestMessage
} from 'alpheios-lexis-cs'

class AlpheiosChineseLocAdapter extends BaseAdapter {
  constructor (config = {}) {
    super()
    this.config = config
    console.info('Local Chinese adapter has been created')

    // Create a messaging service with CEDICT destination
    // TODO: If other adapters will use a messaging service it's more efficient to create a shared single instance of it
    this._messagingService = new MessagingService(new Destination(CedictConfig))
  }

  get languageID () { return ChineseLanguageModel.languageID }

  async fetchChineseData (targetWord, checkContextForward) {
    ChineseSource.collectData()

    return ChineseSource.lookupChinese(targetWord, checkContextForward)
  }

  async fetchCedictData (targetWord, checkContextForward) {
    const requestBody = {
      getWords: {
        words: [targetWord]
      }
    }
    try {
      console.log('fetchCedictData, before await')
      const responseMessage = await this._messagingService.sendRequestTo(CedictConfig.name, new RequestMessage(requestBody))
      console.log('fetchCedictData, after await')
      return responseMessage.body
    } catch (error) {
      return null
    }
  }

  async getHomonym (targetWord, checkContextForward) {
    console.info('getHomonym has been called', targetWord, checkContextForward)
    try {
      const res = await this.fetchChineseData(targetWord, checkContextForward)
      console.log('getHomonym, before await')
      const cedictRes = await this.fetchCedictData(targetWord, checkContextForward)
      // TODO: check a format of cedict response
      console.log('getHomonym, after await')
      console.log('Fetch Chinese data returned', res)
      console.log('Fetch CEDICT data returned', cedictRes)
      if (res) {
        const homonym = this.transformData(res, targetWord)
        const cedictHomonym = this.transformCedictData(cedictRes, targetWord)
        console.info('Homonym returned is', homonym)
        console.info('CEDICT homonym is', cedictHomonym)

        if (!cedictHomonym) {
          this.addError(this.l10n.messages.MORPH_NO_HOMONYM.get(targetWord, this.languageID.toString()))
          return
        }
        return cedictHomonym
      }
    } catch (error) {
      this.addError(this.l10n.messages.MORPH_UNKNOWN_ERROR.get(error.mesage))
      console.info(`Cannot create a homonym: ${error}`)
    }
  }

  transformCedictData (cedictEntries, targetWord) {
    // eslint-disable-next-line no-prototype-builtins
    const characterForm = cedictEntries.hasOwnProperty(CedictCharacterForms.SIMPLIFIED)
      ? CedictCharacterForms.SIMPLIFIED
      : CedictCharacterForms.TRADITIONAL
    let lexemes = [] // eslint-disable-line prefer-const
    cedictEntries[characterForm][targetWord].forEach(entry => {
      const cfData = entry[characterForm]
      const headword = cfData.headword
      // TODO: handle a situation when headword is not available
      let lemma = new Lemma(headword, this.languageID, []) // eslint-disable-line prefer-const

      const features = []
      /* { checkAttribute: 'pinyin', method: this.defineMultipleFeature.bind(this), featureType: Feature.types.pronunciation, featOrder: 4 },
      { checkAttribute: 'format', method: this.defineSimpleFeature.bind(this), featureType: Feature.types.note },
      { checkAttribute: 'mandarin', method: this.defineMultipleFeature.bind(this), featureType: Feature.types.pronunciation, featOrder: 3 },
      { checkAttribute: 'cantonese', method: this.defineMultipleFeature.bind(this), featureType: Feature.types.pronunciation, featOrder: 2 },
      { checkAttribute: 'tang', method: this.defineMultipleFeature.bind(this), featureType: Feature.types.pronunciation, featOrder: 1 },
      { checkAttribute: 'frequency', method: this.defineSimpleFeature.bind(this), featureType: Feature.types.frequency },
      { checkAttribute: 'unicode', method: this.defineSimpleFeature.bind(this), featureType: Feature.types.radical } */

      //      const features = this.extractFeatures(entry)
      //      lemma.addFeatures(features)

      /* features.push(new Feature(Feature.types.pronunciation, [
        [`tang - ${cfData.tang}`, 1], [`tang - ${cfData.tang}`, 1], [`tang - ${cfData.tang}`, 1], [`tang - ${cfData.tang}`, 1]
      ], this.languageID)) */
      //      lemma.addFeatures(features)
      // TODO: Order is reverted
      const pronunciationValues = [`tang - ${cfData.tang}`, `mandarin - ${cfData.mandarin}`, `cantonese - ${cfData.cantonese}`, entry.pinyin]
      lemma.addFeature(this.createFeature(Feature.types.pronunciation, pronunciationValues))
      lemma.addFeature(this.createFeature(Feature.types.note, characterForm))
      if (cfData.radical && cfData.radical.character) lemma.addFeature(this.createFeature(Feature.types.radical, cfData.radical.character))
      if (cfData.frequency) lemma.addFeature(this.createFeature(Feature.types.frequency, cfData.frequency))

      let lexmodel = new Lexeme(lemma, []) // eslint-disable-line prefer-const
      const shortDefs = entry.definitions.map(entry => new Definition(entry, 'eng', 'text/plain', headword))
      lexmodel.meaning.appendShortDefs(shortDefs)

      lexemes.push(lexmodel)
    })

    /* const finalLexemes = []
    lexemes.forEach(lex => {
      const check = finalLexemes.filter(checkLex => {
        const check1 = checkLex.lemma.principalParts[0] === lex.lemma.principalParts[0]

        const check2 = checkLex.lemma.features[Feature.types.pronunciation].value === lex.lemma.features[Feature.types.pronunciation].value

        const check3 = checkLex.meaning.shortDefs[0].text === lex.meaning.shortDefs[0].text

        return check1 && check2 && check3
      })

      if (check.length === 0) {
        finalLexemes.push(lex)
      }
    }) */

    /* if (finalLexemes.length > 0) {
      return new Homonym(finalLexemes, targetWord)
    } else {
      return undefined
    } */

    return new Homonym(lexemes, targetWord)
  }

  transformData (rawLexemes, targetWord) {
    let lexemes = [] // eslint-disable-line prefer-const
    rawLexemes.forEach(rawLexeme => {
      let lemma = new Lemma(rawLexeme.dictEntry, this.languageID, []) // eslint-disable-line prefer-const

      const features = this.extractFeatures(rawLexeme)
      lemma.addFeatures(features)

      const shortdefs = this.extractShortDefinitions(rawLexeme)

      let lexmodel = new Lexeme(lemma, []) // eslint-disable-line prefer-const
      lexmodel.meaning.appendShortDefs(shortdefs)

      lexemes.push(lexmodel)
    })

    const finalLexemes = []
    lexemes.forEach(lex => {
      const check = finalLexemes.filter(checkLex => {
        const check1 = checkLex.lemma.principalParts[0] === lex.lemma.principalParts[0]

        const check2 = checkLex.lemma.features[Feature.types.pronunciation].value === lex.lemma.features[Feature.types.pronunciation].value

        const check3 = checkLex.meaning.shortDefs[0].text === lex.meaning.shortDefs[0].text

        return check1 && check2 && check3
      })

      if (check.length === 0) {
        finalLexemes.push(lex)
      }
    })

    if (finalLexemes.length > 0) {
      return new Homonym(finalLexemes, targetWord)
    } else {
      return undefined
    }
  }

  extractFeatures (rawLexeme) {
    const featuresArr = [
      { checkAttribute: 'pinyin', method: this.defineMultipleFeature.bind(this), featureType: Feature.types.pronunciation, featOrder: 4 },
      { checkAttribute: 'format', method: this.defineSimpleFeature.bind(this), featureType: Feature.types.note },
      { checkAttribute: 'mandarin', method: this.defineMultipleFeature.bind(this), featureType: Feature.types.pronunciation, featOrder: 3 },
      { checkAttribute: 'cantonese', method: this.defineMultipleFeature.bind(this), featureType: Feature.types.pronunciation, featOrder: 2 },
      { checkAttribute: 'tang', method: this.defineMultipleFeature.bind(this), featureType: Feature.types.pronunciation, featOrder: 1 },
      { checkAttribute: 'frequency', method: this.defineSimpleFeature.bind(this), featureType: Feature.types.frequency },
      { checkAttribute: 'unicode', method: this.defineSimpleFeature.bind(this), featureType: Feature.types.radical }
    ]
    let features = [] // eslint-disable-line prefer-const

    featuresArr.forEach(featureConfig => {
      const featureVal = featureConfig.method(featureConfig, rawLexeme, features)
      if (featureVal) {
        features.push(featureVal)
      }
    })
    return features
  }

  defineMultipleFeature (featureConfig, rawLexeme, features) {
    if (!rawLexeme[featureConfig.checkAttribute]) {
      return
    }

    const featType = featureConfig.featureType
    let featObj = features.filter(feat => feat.type === featType) // eslint-disable-line prefer-const

    if (featObj.length === 0) {
      return new Feature(featureConfig.featureType, [[rawLexeme[featureConfig.checkAttribute], featureConfig.featOrder]], this.languageID)
    } else {
      featObj[0].addValue(rawLexeme[featureConfig.checkAttribute], featureConfig.featOrder)
    }
  }

  defineSimpleFeature (featureConfig, rawLexeme) {
    if (rawLexeme[featureConfig.checkAttribute]) {
      return new Feature(featureConfig.featureType, rawLexeme[featureConfig.checkAttribute], this.languageID)
    }
  }

  createFeature (featureType, values) {
    if (Array.isArray(values)) {
      // Create a multiple feature
      return new Feature(featureType, values, this.languageID)
    } else {
      // Create a singular feature
      return new Feature(featureType, values, this.languageID)
    }
  }

  extractShortDefinitions (rawLexeme) {
    let shortdefs = [] // eslint-disable-line prefer-const
    if (rawLexeme.shortDef) {
      shortdefs.push(new Definition(rawLexeme.shortDef, 'eng', 'text/plain', rawLexeme.dictEntry))
    }
    return shortdefs
  }
}

export default AlpheiosChineseLocAdapter

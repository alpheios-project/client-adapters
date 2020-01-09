/* eslint-disable no-unused-vars */
import BaseAdapter from '@/adapters/base-adapter'
import ChineseSource from '@/adapters/chineseloc/chinese-source/chinese-source.js'
import { ChineseLanguageModel, Lemma, Lexeme, Homonym, Feature, Definition } from 'alpheios-data-models'
import {
  MessagingService, WindowIframeDestination as Destination, CedictDestinationConfig as CedictConfig,
  CedictCharacterForms, RequestMessage
} from 'alpheios-lexis-cs'

const msgServiceName = 'AdaptersLexisService'

class AlpheiosChineseLocAdapter extends BaseAdapter {
  constructor (config = {}) {
    super()
    this.config = config

    /*
    AlpheiosChineseLocAdapter is created every time when a new lexical request for Chinese data comes in.
    We do not want to create a new instance of a messaging service with that. Thus, we'll use a single
    instance of the service that will be created once and reused across consecutive constructor invocations.
     */
    if (!MessagingService.hasService(msgServiceName)) {
      MessagingService.createService(msgServiceName, new Destination(CedictConfig))
    }
    this._messagingService = MessagingService.getService(msgServiceName)
  }

  get languageID () { return ChineseLanguageModel.languageID }

  // region Pinyin formatting functions
  // TODO: Do these functions really belong in here?
  static isVowel (aLetter) {
    return ['a', 'e', 'i', 'o', 'u'].includes(aLetter)
  }

  static formatPinyin (aPinyin) {
    const _a = ['\u0101', '\u00E1', '\u01CE', '\u00E0', 'a']
    const _e = ['\u0113', '\u00E9', '\u011B', '\u00E8', 'e']
    const _i = ['\u012B', '\u00ED', '\u01D0', '\u00EC', 'i']
    const _o = ['\u014D', '\u00F3', '\u01D2', '\u00F2', 'o']
    const _u = ['\u016B', '\u00FA', '\u01D4', '\u00F9', 'u']
    const _v = ['\u01D6', '\u01D8', '\u01DA', '\u01DC', '\u00FC']

    // Remove spaces before and after split parts; eliminate empty split parts
    aPinyin = aPinyin.split(/(\d)/).map(el => el.trim()).filter(el => Boolean(el))

    const formatedPinyin = []
    const toneFormat = {
      1: 0, 2: 1, 3: 2, 4: 3
    }

    for (let j = 0; j < aPinyin.length; j++) {
      if (j % 2 === 0) {
        let pin = aPinyin[j]
        const tone = toneFormat[aPinyin[j + 1]] ? toneFormat[aPinyin[j + 1]] : 4

        if (pin.indexOf('a') !== -1) {
          pin = pin.replace('a', _a[tone])
        } else if (pin.indexOf('e') !== -1) {
          pin = pin.replace('e', _e[tone])
        } else if (pin.indexOf('ou') !== -1) {
          pin = pin.replace('o', _o[tone])
        } else {
          for (let k = pin.length - 1; k >= 0; k--) {
            if (this.isVowel(pin[k])) {
              switch (pin[k]) {
                case 'i':
                  pin = pin.replace('i', _i[tone])
                  break
                case 'o':
                  pin = pin.replace('o', _o[tone])
                  break
                case 'u':
                  if (k + 1 < pin.length - 1 && pin[k + 1] === ':') { pin = pin.replace('u:', _v[tone]) } else { pin = pin.replace('u', _u[tone]) }
                  break
                default:
                  console.warn('some kind of weird vowel', pin[k])
              }
              break
            }
          }
        }
        formatedPinyin.push(pin)
      }
    }
    return formatedPinyin.join(' ').trim()
  }
  // endregion Pinyin formatting functions

  async fetchChineseData (targetWord, checkContextForward) {
    ChineseSource.collectData()

    return ChineseSource.lookupChinese(targetWord, checkContextForward)
  }

  async fetchCedictData (targetWord, contextForward) {
    const requestBody = {
      getWords: {
        words: this.constructor._buildWordList(targetWord, contextForward)
      }
    }
    const responseMessage = await this._messagingService.sendRequestTo(CedictConfig.name, new RequestMessage(requestBody))
    return responseMessage.body
  }

  static _buildWordList (targetWord, contextForward) {
    const wordList = [targetWord]
    if (contextForward) {
      for (let i = 0; i < contextForward.length; i++) {
        wordList.push(contextForward.slice(0, i + 1))
      }
    }
    return wordList
  }

  async getHomonym (targetWord, contextForward) {
    try {
      const cedictRes = await this.fetchCedictData(targetWord, contextForward)
      // TODO: check a format of cedict response
      if (Object.keys(cedictRes).length === 0) {
        this.addError(this.l10n.messages.MORPH_NO_HOMONYM.get(targetWord, this.languageID.toString()))
        return
      }
      // const homonym = this.transformData(res, targetWord)
      const cedictHomonym = this.transformCedictData(cedictRes, targetWord)

      if (!cedictHomonym) {
        this.addError(this.l10n.messages.MORPH_NO_HOMONYM.get(targetWord, this.languageID.toString()))
        return
      }
      return cedictHomonym
    } catch (error) {
      this.addError(this.l10n.messages.MORPH_UNKNOWN_ERROR.get(error.mesage))
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

      // eslint-disable-next-line prefer-const
      let pronunciationValues = ['tang', 'mandarin', 'cantonese'].reduce((arr, i) => {
        // Add all of the values listed above to an array or pronunciation feature. Each feature value will be preceded with its name.
        // TODO: Shall we store each pronunciation value within a separate Feature object?
        if (cfData[i]) arr.push(`${i} - ${cfData[i]}`); return arr
      }, [])
      if (entry.pinyin) pronunciationValues.push(this.constructor.formatPinyin(entry.pinyin))
      lemma.addFeature(this.createFeature(Feature.types.pronunciation, pronunciationValues))
      lemma.addFeature(this.createFeature(Feature.types.note, characterForm))
      if (cfData.radical && cfData.radical.character) lemma.addFeature(this.createFeature(Feature.types.radical, cfData.radical.character))
      if (cfData.frequency) lemma.addFeature(this.createFeature(Feature.types.frequency, cfData.frequency, 10))

      let lexModel = new Lexeme(lemma, []) // eslint-disable-line prefer-const
      const shortDefs = entry.definitions.map(entry => new Definition(entry, 'eng', 'text/plain', headword))
      lexModel.meaning.appendShortDefs(shortDefs)
      lexemes.push(lexModel)
    })
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
    return new Feature(featureType, values, this.languageID)
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

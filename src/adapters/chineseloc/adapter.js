/* eslint-disable no-unused-vars */
import BaseAdapter from '@/adapters/base-adapter'
import ChineseSource from '@/adapters/chineseloc/chinese-source/chinese-source.js'
import { ChineseLanguageModel, Lemma, Lexeme, Homonym, Feature, Definition } from 'alpheios-data-models'

class AlpheiosChineseLocAdapter extends BaseAdapter {
  constructor (config = {}) {
    super()
    this.config = config
  }

  get languageID () { return ChineseLanguageModel.languageID }

  fetchChineseData (targetWord) {
    ChineseSource.collectData()

    return ChineseSource.lookupChinese(targetWord)
  }

  getHomonym (targetWord) {
    console.info('chineseAdapter ', targetWord)
    // try {
    const res = this.fetchChineseData(targetWord)
    if (res) {
      let homonym = this.transformData(res, targetWord)

      if (!homonym) {
        this.addError(this.l10n.messages['MORPH_TUFTS_NO_HOMONYM'].get(targetWord, this.languageID.toString()))
        return
      }
      return homonym
    }
    /*
    } catch (error) {
      this.addError(this.l10n.messages['MORPH_TUFTS_UNKNOWN_ERROR'].get(error.mesage))
    }
    */
  }

  transformData (rawLexemes, targetWord) {
    let lexemes = []
    rawLexemes.forEach(rawLexeme => {
      let lemma = new Lemma(targetWord, this.languageID, [rawLexeme.dictEntry])

      let features = this.extractFeatures(rawLexeme)
      lemma.addFeatures(features)

      let shortdefs = this.extractShortDefinitions(rawLexeme)

      let lexmodel = new Lexeme(lemma, [])
      lexmodel.meaning.appendShortDefs(shortdefs)

      lexemes.push(lexmodel)
    })

    let finalLexemes = []
    lexemes.forEach(lex => {
      let check = finalLexemes.filter(checkLex => {
        let check1 = checkLex.lemma.principalParts[0] === lex.lemma.principalParts[0]
        // console.info('checkLex 1 - ', check1, checkLex.lemma.principalParts, lex.lemma.principalParts)

        let check2 = checkLex.lemma.features[Feature.types.pronunciation].value === lex.lemma.features[Feature.types.pronunciation].value
        // console.info('checkLex 2 - ', check2, checkLex.lemma.features[Feature.types.pronunciation], lex.lemma.features[Feature.types.pronunciation])

        let check3 = checkLex.meaning.shortDefs[0].text === lex.meaning.shortDefs[0].text
        // console.info('checkLex 3 - ', check3, checkLex.meaning.shortDefs, lex.meaning.shortDefs)

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
    let featuresArr = [
      { checkAttribute: 'pinyin', method: this.defineSimpleFeature.bind(this), featureType: Feature.types.pronunciation },
      { checkAttribute: 'format', method: this.defineFeatureFormat.bind(this), featureType: Feature.types.dialect },
      { checkAttribute: 'mandarin', method: this.defineSimpleFeature.bind(this), featureType: Feature.types.mandarin },
      { checkAttribute: 'cantonese', method: this.defineSimpleFeature.bind(this), featureType: Feature.types.cantonese },
      { checkAttribute: 'tang', method: this.defineSimpleFeature.bind(this), featureType: Feature.types.tang },
      { checkAttribute: 'frequency', method: this.defineSimpleFeature.bind(this), featureType: Feature.types.frequency },
      { checkAttribute: 'radical', method: this.defineSimpleFeature.bind(this), featureType: Feature.types.radical }
    ]
    let features = []

    featuresArr.forEach(featureConfig => {
      let featureVal = featureConfig.method(featureConfig, rawLexeme)
      if (featureVal) {
        features.push(featureVal)
      }
    })
    return features
  }

  defineSimpleFeature (featureConfig, rawLexeme) {
    if (rawLexeme[featureConfig.checkAttribute]) {
      return new Feature(featureConfig.featureType, rawLexeme[featureConfig.checkAttribute], this.languageID)
    }
  }

  defineFeatureFormat (featureConfig, rawLexeme) {
    if (rawLexeme[featureConfig.checkAttribute]) {
      let value = null
      if (rawLexeme[featureConfig.checkAttribute] === 'simp') {
        value = 'simple'
      }
      if (rawLexeme[featureConfig.checkAttribute] === 'trad') {
        value = 'traditional'
      }

      if (value) {
        return new Feature(featureConfig.featureType, value, this.languageID)
      }
    }
  }

  extractShortDefinitions (rawLexeme) {
    let shortdefs = []
    shortdefs.push(new Definition(rawLexeme.shortDef, 'eng', 'text/plain', rawLexeme.word))
    return shortdefs
  }
}

export default AlpheiosChineseLocAdapter

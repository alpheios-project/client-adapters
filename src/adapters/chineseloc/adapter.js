/* eslint-disable no-unused-vars */
import BaseAdapter from '@/adapters/base-adapter'
import ChineseSource from '@/adapters/chineseloc/chinese-source/chinese-source.js'
import { ChineseLanguageModel, Lemma, Lexeme, Homonym, Feature, Definition } from 'alpheios-data-models'

class AlpheiosChineseLocAdapter extends BaseAdapter {
  constructor (config = {}) {
    super()
    this.config = {
      category: 'morphology',
      adapterName: 'chineseloc',
      method: 'getHomonym'
    }
  }

  get languageID () { return ChineseLanguageModel.languageID }

  fetchChineseData (targetWord) {
    ChineseSource.collectData()

    return ChineseSource.lookupChinese(targetWord)
  }

  getHomonym (targetWord) {
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
      let lemma = new Lemma(rawLexeme.dictEntry, this.languageID)

      let features = this.extractFeatures(rawLexeme)
      lemma.addFeatures(features)

      let shortdefs = this.extractShortDefinitions(rawLexeme)

      let lexmodel = new Lexeme(lemma, [])
      lexmodel.meaning.appendShortDefs(shortdefs)

      lexemes.push(lexmodel)
    })

    if (lexemes.length > 0) {
      return new Homonym(lexemes, targetWord)
    } else {
      return undefined
    }
  }

  extractFeatures (rawLexeme) {
    let featuresArr = [
      { checkAttribute: 'pinyin', method: this.defineSimpleFeature.bind(this), featureType: Feature.types.pronunciation },
      { checkAttribute: 'format', method: this.defineSimpleFeature.bind(this), featureType: Feature.types.dialect },
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

  extractShortDefinitions (rawLexeme) {
    let shortdefs = []
    shortdefs.push(new Definition(rawLexeme.shortDef, 'eng', 'text/plain', rawLexeme.word))
  }
}

export default AlpheiosChineseLocAdapter

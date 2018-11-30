import { LanguageModelFactory as LMF, LatinLanguageModel, GreekLanguageModel, ResourceProvider, Lexeme, Lemma, Feature, Inflection, Homonym } from 'alpheios-data-models'
import BaseAdapter from '@/base-adapter'

import DefaultConfig from '@/alpheiostb/config.json'
import xmlToJSON from 'xmltojson'
import AdapterError from '@/errors/adapter-error'

class AlpheiosTreebankAdapter extends BaseAdapter {
  constructor (config = {}) {
    super()
    this.config = this.uploadConfig(config, DefaultConfig)
    this.models = { 'lat': LatinLanguageModel, 'grc': GreekLanguageModel }
  }

  async getHomonym (languageID, word) {
    let url = this.prepareRequestUrl(word)
    if (!url) {
      return new AdapterError(this.config.category, this.config.adapterName, this.config.method, `Url was not created for the word - ${word}`)
    }
    try {
      if (url) {
        let res = await this.fetch(url, { type: 'xml' })

        if (res.constructor.name === 'AdapterError') {
          return res.update(this.config)
        }

        if (res) {
          let langCode = LMF.getLanguageCodeFromId(languageID)

          let jsonObj = xmlToJSON.parseString(res)
          jsonObj.words[0].word[0].entry[0].dict[0].hdwd[0]._attr = { lang: { _value: langCode } }

          let homonym = this.transform(jsonObj, jsonObj.words[0].word[0].form[0]._text)
          return homonym
        } else {
          return new AdapterError(this.config.category, this.config.adapterName, this.config.method, `Empty result for word - ${word}`)
        }
      }
    } catch (error) {
      return new AdapterError(this.config.category, this.config.adapterName, this.config.method, error.mesage)
    }
  }

  prepareRequestUrl (word) {
    let [text, fragment] = word.split(/#/)
    let url

    if (this.config.texts.includes(text)) {
      url = this.config.url.replace('r_TEXT', text)
      url = url.replace('r_WORD', fragment).replace('r_CLIENT', this.config.clientId)
    }
    return url
  }

  transform (jsonObj, targetWord) {
    'use strict'
    let providerUri = this.config.providerUri
    let providerRights = this.config.providerRights
    let provider = new ResourceProvider(providerUri, providerRights)

    let hdwd = jsonObj.words[0].word[0].entry[0].dict[0].hdwd[0]
    let lemmaText = hdwd._text
    // the Alpheios v1 treebank data kept trailing digits on the lemmas
    // these won't match morphology service lemmas which have them stripped
    lemmaText = lemmaText.replace(/\d+$/, '')

    let model = this.models[hdwd._attr.lang._value]
    let lemma = new Lemma(lemmaText, model.languageCode)
    let lexmodel = new Lexeme(lemma, [])
    let inflection = new Inflection(lemmaText, model.languageID, null, null, null)
    let infl = jsonObj.words[0].word[0].entry[0].infl[0]
    inflection.addFeature(new Feature(Feature.types.fullForm, targetWord, model.languageID))

    let features = this.config.featuresArray
    for (let feature of features) {
      let localName = feature[0]
      let featureType = feature[1]
      let addToLemma = feature[2]
      if (infl[localName]) {
        let obj = model.typeFeature(Feature.types[featureType]).createFeatures(infl[localName][0]._text, 1)
        inflection.addFeature(obj)
        if (addToLemma) {
          lemma.addFeature(obj)
        }
      }
    }
    lexmodel.inflections = [ inflection ]
    return new Homonym([ResourceProvider.getProxy(provider, lexmodel)], targetWord)
  }
}

export default AlpheiosTreebankAdapter

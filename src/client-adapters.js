import AlpheiosTuftsAdapter from '@/adapters/tufts/adapter'
import AlpheiosTreebankAdapter from '@/adapters/alpheiostb/adapter'
import AlpheiosLemmaTranslationsAdapter from '@/adapters/translations/adapter'
import AlpheiosLexiconsAdapter from '@/adapters/lexicons/adapter'

import WrongMethodError from '@/errors/wrong-method-error'
import NoRequiredParamError from '@/errors/no-required-param-error'

import AdaptersConfig from '@/adapters/adapters-config.json'

let cachedConfig = new Map()
let cachedAdaptersList = new Map()

class ClientAdapters {
  /*
   * it is used for uploading data from AdaptersConfig to cachedConfig and CachedAdaptersList
  */
  static init () {
    if (cachedConfig.size === 0) {
      for (let category in AdaptersConfig) {
        let adapters = {}
        for (let adapterKey in AdaptersConfig[category]) {
          let adapterData = AdaptersConfig[category][adapterKey]

          adapters[adapterKey] = {
            adapter: ClientAdapters[adapterData.adapter],
            methods: adapterData.methods,
            params: adapterData.params
          }
        }
        cachedConfig.set(category, adapters)
      }

      for (let key of cachedConfig.keys()) {
        let res = {}
        Object.keys(cachedConfig.get(key)).forEach(typeAdapter => {
          res[typeAdapter] = cachedConfig.get(key)[typeAdapter].adapter
        })

        cachedAdaptersList.set(key, res)
      }
    }
  }
  /*
  *  Additional abstraction layer for structuring adapters
  *  it is used for retrieving data from morphology category
  */
  static get morphology () {
    ClientAdapters.init()
    return cachedAdaptersList.get('morphology')
  }
  /*
  * it is used for retrieving data from lexicon category
  */
  static get lexicon () {
    ClientAdapters.init()
    return cachedAdaptersList.get('lexicon')
  }
  /*
  * it is used for retrieving data from lemmatranslation category
  */
  static get lemmatranslation () {
    ClientAdapters.init()
    return cachedAdaptersList.get('lemmatranslation')
  }
  /*
  * This method checks if given method is registered in config for category.adapterName
  * @param {category} String - category name - morphology, lemmatranslation, lexicon
  * @param {adapterName} String - adapter name - tufts, treebankAdapter, alpheios
  * @param {methodName} String - method name - method name that should be checked, for example getHomonym, fetchTranslations and etc.
  */
  static checkMethod (category, adapterName, methodName) {
    if (!cachedConfig.get(category)[adapterName].methods.includes(methodName)) {
      throw new WrongMethodError(category, adapterName, methodName)
    }
  }

  /*
  * This method checks if given array with parameteres doesn\'t have required parameters, registered in config file
  * @param {params} [String] - array of parameter\' names for being checked
  * @param {category} String - category name - morphology, lemmatranslation, lexicon
  * @param {adapterName} String - adapter name - tufts, treebankAdapter, alpheios
  * @param {methodName} String - method name - method name that should be checked, for example getHomonym, fetchTranslations and etc.
  */
  static checkParam (params, category, adapterName, methodName) {
    if (cachedConfig.get(category)[adapterName].params) {
      cachedConfig.get(category)[adapterName].params[methodName].forEach(paramName => {
        if (!params[paramName]) {
          throw new NoRequiredParamError(category, adapterName, methodName, paramName)
        }
      })
    }
  }

  /*
  * This method executes both checks for given options - checks method and given parameters from options
  * @param {category} String - category name - morphology, lemmatranslation, lexicon
  * @param {adapterName} String - adapter name - tufts, treebankAdapter, alpheios
  * @param {options} Object - method name - method name that should be checked, for example getHomonym, fetchTranslations and etc.
  */
  static checkMethodParam (category, adapterName, options) {
    ClientAdapters.checkMethod(category, adapterName, options.method)
    ClientAdapters.checkParam(options.params, category, adapterName, options.method)
  }

  /*
   * it is used for getting data from morph adapter
   * @param {options} Object - object contains parametes:
   *    @param {options.method} String - for now one value - "getHomonym" - action that should be done wth the help of adapter
   *    @param {options.params.languageID} Symbol - languageID value for the word
   *    @param {options.params.word} String - target word for what we will receive morph data
   * Returned values:
   *    - throw an Error if there is used a wrong metod or not enough required parameters
   *    - null, method is registered in configuration file but not implemented here
   *    - { result: Homonym, errors: [AdapterError] }
*/

  static async maAdapter (options) {
    ClientAdapters.checkMethodParam('morphology', 'tufts', options)

    let localMaAdapter = new AlpheiosTuftsAdapter({
      category: 'morphology',
      adapterName: 'tufts',
      method: options.method
    })

    if (options.method === 'getHomonym') {
      let homonym = await localMaAdapter.getHomonym(options.params.languageID, options.params.word)
      return { result: homonym, errors: localMaAdapter.errors }
    }
    return null
  }

  /*
   * it is used for getting data from treebank adapter
   * @param {options} Object - object contains parametes:
   *    @param {options.method} String - for now one value - "getHomonym" - action that should be done wth the help of adapter
   *    @param {options.params.languageID} Symbol - languageID value for the word
   *    @param {options.params.wordref} String - target wordref for getting data from treebank adapter
   * Returned values:
   *    - throw an Error if there is used a wrong metod or not enough required parameters
   *    - null, method is registered in configuration file but not implemented here
   *    - { result: Homonym, errors: [AdapterError] }
*/

  static async tbAdapter (options) {
    ClientAdapters.checkMethodParam('morphology', 'alpheiosTreebank', options)

    let localTbAdapter = new AlpheiosTreebankAdapter({
      category: 'morphology',
      adapterName: 'alpheiosTreebank',
      method: options.method
    })
    if (options.method === 'getHomonym') {
      let homonym = await localTbAdapter.getHomonym(options.params.languageID, options.params.wordref)
      return { result: homonym, errors: localTbAdapter.errors }
    }
    return null
  }

  /*
   * it is used for getting data from translations adapter
   * @param {options} Object - object contains parametes:
   *    @param {options.method} String - for now one value - "fetchTranslations" - action that should be done wth the help of adapter
   *    @param {options.params.homonym} Homonym - homonym for retrieving translations
   *    @param {options.params.browserLang} String - language for translations
   * Returned values:
   *    - throw an Error if there is used a wrong metod or not enough required parameters
   *    - null, method is registered in configuration file but not implemented here
   *    - { result: Boolean, errors: [AdapterError] }
*/
  static async lemmaTranslations (options) {
    ClientAdapters.checkMethodParam('lemmatranslation', 'alpheios', options)

    let localLemmasAdapter = new AlpheiosLemmaTranslationsAdapter({
      category: 'lemmatranslation',
      adapterName: 'alpheios',
      method: options.method
    })

    if (options.method === 'fetchTranslations') {
      let res = await localLemmasAdapter.getTranslationsList(options.params.homonym, options.params.browserLang)
      return { result: res, errors: localLemmasAdapter.errors }
    }
    return null
  }

  /*
   * it is used for getting data from lexicons adapter
   * @param {options} Object - object contains parametes:
   *    @param {options.method} String - action that should be done wth the help of adapter - fetchShortDefs and fetchFullDefs
   *    @param {options.params.homonym} Homonym - homonym for retrieving translations
   *    @param {options.params.opts} {allow: [String]} - an object with array of urls for dictionaries
   *    @param {options.params.callBackEvtSuccess} PSEvent - an event that should be published on success result
   *    @param {options.params.callBackEvtFailed} PSEvent - an event that should be published on failed result
   * Returned values:
   *    - throw an Error if there is used a wrong metod or not enough required parameters
   *    - null, method is registered in configuration file but not implemented here
   *    - { result: Boolean, errors: [AdapterError] }
*/
  static async lexicons (options) {
    ClientAdapters.checkMethodParam('lexicon', 'alpheios', options)

    let adapterParams = {
      category: 'lexicon',
      adapterName: 'alpheios',
      method: options.method,
      callBackEvtSuccess: options.params.callBackEvtSuccess,
      callBackEvtFailed: options.params.callBackEvtFailed
    }

    let localLexiconsAdapter = new AlpheiosLexiconsAdapter(adapterParams)

    if (options.method === 'fetchShortDefs') {
      let res = await localLexiconsAdapter.fetchShortDefs(options.params.homonym, options.params.opts)
      return { result: res, errors: localLexiconsAdapter.errors }
    }
    if (options.method === 'fetchFullDefs') {
      let res = await localLexiconsAdapter.fetchFullDefs(options.params.homonym, options.params.opts)
      return { result: res, errors: localLexiconsAdapter.errors }
    }
    return null
  }
}

export default ClientAdapters

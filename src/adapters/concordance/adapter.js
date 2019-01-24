import DefaultConfig from '@/adapters/concordance/config.json'
import AuthorWorkConfigConfig from '@/adapters/concordance/author-work.json'

import { ResourceProvider, Author, TextWork, WordUsageExample } from 'alpheios-data-models'
import BaseAdapter from '@/adapters/base-adapter'

class AlpheiosConcordanceAdapter extends BaseAdapter {
  /**
   * Adapter uploads config data and creates provider
   * @param {Object} config - properties with higher priority
  */
  constructor (config = {}) {
    super()
    this.config = this.uploadConfig(config, DefaultConfig)
    this.provider = new ResourceProvider(this.config.url, this.config.rights)
    this.authors = []
  }

  /**
  * This method retrieves a list of available authors and textWorks.
  * For now it uploads data from json file, but later it will fetch data from cordance api
  * @param {Boolean} reload - if true - data will be forced to reload from source
  * @return {Author[]]}
  */
  async getAuthorsWorks (reload = false) {
    try {
      if (reload || this.authors.length === 0) {
        this.authorWorkData = await this.uploadConfig({}, AuthorWorkConfigConfig)

        this.authors = []
        for (let authorWorkDataItem of Object.values(this.authorWorkData.authors)) {
          let author = this.createAuthor(authorWorkDataItem)
          this.authors.push(author)
        }
      }
      return this.authors
    } catch (error) {
      this.addError(this.l10n.messages['CONCORDANCE_AUTHOR_UPLOAD_ERROR'].get(error.message))
    }
  }

  /**
  * This method retrieves a list of word usage examples from corcondance api and creates WordUsageExample-s.
  * @param {Homonym} homonym - homonym for retrieving word usage examples
  * @param {Object} filters - { author: {Author}, textWork: {TextWork} } - filter's property for getting data,
  *                           it could be filtered: no filter, by author, by author and textWork
  * @param {Object} pagination - { property: 'max', value: {Integer} } - property for setting max limit for the result
  * @param {Object} sort - { } - it is an empty property for future sort feature
  * @return {Object} - with the following format
  *         {
  *           {WordUsageExample[]} wordUsageExamples - result wordUsageExamples
  *           {String} targetWord - source targetWord
  *           {String} language - source languageCode
  *         }
  */
  async getWordUsageExamples (homonym, filters = {}, pagination = {}, sort = {}) {
    try {
      let url = this.createFetchURL(homonym, filters, pagination, sort)
      let wordUsageListRes = await this.fetch(url)
      let parsedWordUsageList = await this.parseWordUsageResult(wordUsageListRes, homonym)
      return {
        wordUsageExamples: parsedWordUsageList,
        targetWord: homonym.targetWord,
        language: homonym.language
      }
    } catch (error) {
      this.addError(this.l10n.messages['CONCORDANCE_WORD_USAGE_FETCH_ERROR'].get(error.message))
    }
  }

  /**
  * This method constructs full url for getting data for getWordUsageExamples method using properties.
  * @param {Homonym} homonym - homonym for retrieving word usage examples
  * @param {Object} filters - { author: {Author}, textWork: {TextWork} } - filter's property for getting data,
  *                           it could be filtered: no filter, by author, by author and textWork
  * @param {Object} pagination - { property: 'max', value: {Integer} } - property for setting max limit for the result
  * @param {Object} sort - { } - it is an empty property for future sort feature
  * @return {String}
  */
  createFetchURL (homonym, filters, pagination, sort) {
    let filterFormatted = this.formatFilter(filters)
    let paginationFormatted = this.formatPagination(pagination)

    return `${this.config.url}${homonym.targetWord}${filterFormatted}${paginationFormatted}`
  }

  /**
  * This method formats filters property for fetch url.
  * @param {Object} filters - { author: {Author}, textWork: {TextWork} } - filter's property for getting data,
  *                           it could be filtered: no filter, by author, by author and textWork
  * @return {String}
  */
  formatFilter (filters) {
    if (filters && filters.author) {
      if (filters.textWork) {
        return `[${filters.author.ID}:${filters.textWork.ID}]`
      }
      return `[${filters.author.ID}]`
    }
    return ''
  }

  /**
  * This method formats pagination property for fetch url.
  * @param {Object} pagination - { property: 'max', value: {Integer} } - property for setting max limit for the result
  * @return {String}
  */
  formatPagination (pagination) {
    if (pagination && pagination.property && (pagination.property === 'max') && pagination.value) {
      return `?${pagination.property}=${parseInt(pagination.value)}`
    }
    return ''
  }

  /**
  * This method parses json result from concordance source for word usage examples.
  * @param {Object} jsonObj - json response from url
  * @param {Homonym} homonym - homonym for retrieving word usage examples
  * @param {Author} author - author from filter
  * @param {TextWork} textWork - textWork from filter
  * @return {WordUsageExample[]}
  */
  async parseWordUsageResult (jsonObj, homonym) {
    let wordUsageExamples = []
    let author, textWork
    for (let jsonObjItem of jsonObj) {
      if (!author || !textWork) {
        author = await this.getAuthorByAbbr(jsonObjItem)
        textWork = this.getTextWorkByAbbr(author, jsonObjItem)
      }

      let wordUsageExample = this.createWordUsageExample(jsonObjItem, homonym, author, textWork)
      wordUsageExamples.push(wordUsageExample)
    }
    return wordUsageExamples
  }

  async getAuthorByAbbr (jsonObj) {
    if (jsonObj.cit && this.authors.length > 0) {
      let authorAbbr = jsonObj.cit.split('.')[0]
      return this.authors.find(author => author.abbreviation() === authorAbbr)
    }
    return null
  }

  getTextWorkByAbbr (author, jsonObj) {
    if (jsonObj.cit && author && author.works.length > 0) {
      let textWorkAbbr = jsonObj.cit.split('.')[1]
      return author.works.find(textWork => textWork.abbreviation() === textWorkAbbr)
    }
    return null
  }

  /**
  * This property is used to define prefix fr extract ID
  * @returns {String}
  */
  get defaultIDPrefix () {
    return 'phi'
  }

  /**
  * Method returns Author for given jsonObj (from concordance API)
  * @param {Object} jsonObj - json object with data of the Author
  * @returns {Author}
  */
  createAuthor (jsonObj) {
    let titles = {}
    jsonObj.title.forEach(titleItem => {
      titles[titleItem['@lang']] = titleItem['@value']
    })

    let abbreviations = {}
    jsonObj.abbreviations.forEach(abbrItem => {
      abbreviations[abbrItem['@lang']] = abbrItem['@value'].replace('.', '')
    })

    let author = new Author(jsonObj.urn, titles, abbreviations)
    author.ID = this.extractIDFromURNAuthor(author.urn)
    let works = []

    jsonObj.works.forEach(workItem => {
      works.push(this.createTextWork(author, workItem))
    })

    author.works = works
    return author
  }

  /**
  * Method extracts ID from the urn, if it is correct. Otherwise it returns null.
  * @returns {Number, null}
  */
  extractIDFromURNAuthor (urn) {
    let partsUrn = urn.split(':')
    if (Array.isArray(partsUrn) && partsUrn.length >= 4) {
      let workIDPart = partsUrn[3].indexOf('.') === -1 ? partsUrn[3] : partsUrn[3].substr(0, partsUrn[3].indexOf('.'))
      return parseInt(workIDPart.replace(this.defaultIDPrefix, ''))
    }
    return null
  }

  /**
  * Method returns TextWork for given jsonObj (from concordance API)
  * @param {Author} author - author of the textWork
  * @param {Object} jsonObj - json object with data of the TextWork
  * @returns {TextWork}
  */
  createTextWork (author, jsonObj) {
    let titles = {}
    jsonObj.title.forEach(titleItem => {
      titles[titleItem['@lang']] = titleItem['@value']
    })

    let abbreviations = {}
    jsonObj.abbreviations.forEach(abbrItem => {
      abbreviations[abbrItem['@lang']] = abbrItem['@value'].replace('.', '')
    })

    let textWork = new TextWork(author, jsonObj.urn, titles, abbreviations)
    textWork.ID = this.extractIDFromURNTextWork(textWork.urn)
    return textWork
  }

  /**
  * Method extracts ID from the urn, if it is correct. Otherwise it returns null.
  * @returns {Number, null}
  */
  extractIDFromURNTextWork (urn) {
    let partsUrn = urn.split(':')

    if (Array.isArray(partsUrn) && partsUrn.length >= 4) {
      let workIDPart = partsUrn[3].indexOf('.') === -1 ? null : partsUrn[3].substr(partsUrn[3].indexOf('.') + 1)

      return parseInt(workIDPart.replace(this.defaultIDPrefix, ''))
    }
    return null
  }

  /**
  * Creates WordUsageExample object from jsonObj, homonym, author, textWork and link from the adapter config
  * @param {Object} jsonObj - json object from concordance api
  * @param {Homonym} homonym - source homonym object
  * @param {Author} author - source author object, could be undefined
  * @param {TextWork} textWork - source textWork object, could be undefined
  * @param {String} sourceLink - sourceTextUrl from the adapter config file
  * @returns {WordUsageExample}
  */
  createWordUsageExample (jsonObj, homonym, author, textWork) {
    let source = this.config.sourceTextUrl + jsonObj.link
    let wordUsageExample = new WordUsageExample(homonym.language, jsonObj.target, jsonObj.left, jsonObj.right, source, jsonObj.cit)
    wordUsageExample.author = author
    wordUsageExample.textWork = textWork
    wordUsageExample.homonym = homonym

    return wordUsageExample
  }
}

export default AlpheiosConcordanceAdapter

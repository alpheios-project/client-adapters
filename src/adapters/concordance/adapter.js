import DefaultConfig from '@/adapters/concordance/config.json'
import AuthorWorkConfigConfig from '@/adapters/concordance/author-work.json'

import { ResourceProvider, Author, WordUsageExample } from 'alpheios-data-models'
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
  * @return {[Author]}
  */
  async getAuthorsWorks () {
    try {
      this.authorWorkData = await this.uploadConfig({}, AuthorWorkConfigConfig)

      this.authors = []
      for (let authorWorkDataItem of Object.values(this.authorWorkData.authors)) {
        let author = Author.create(authorWorkDataItem)
        this.authors.push(author)
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
      let parsedWordUsageList = this.parseWordUsageResult(wordUsageListRes, homonym, filters.author, filters.textWork)
      return {
        wordUsageExamples: parsedWordUsageList,
        targetWord: homonym.targetWord,
        language: homonym.language
      }
    } catch (error) {
      this.addError(this.l10n.messages['TRANSLATION_UNKNOWN_ERROR'].get(error.message))
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
    if (filters.author) {
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
    if (pagination && pagination.property && pagination.value) {
      return `?${pagination.property}=${pagination.value}`
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
  parseWordUsageResult (jsonObj, homonym, author, textWork) {
    let wordUsageExamples = []
    for (let jsonObjItem of jsonObj) {
      let wordUsageExample = WordUsageExample.readObject(jsonObjItem, homonym, author, textWork, this.config.sourceTextUrl)
      wordUsageExamples.push(wordUsageExample)
    }
    return wordUsageExamples
  }
}

export default AlpheiosConcordanceAdapter

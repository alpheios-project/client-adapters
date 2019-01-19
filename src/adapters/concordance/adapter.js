import DefaultConfig from '@/adapters/concordance/config.json'
import AuthorWorkConfigConfig from '@/adapters/concordance/author-work.json'

import { ResourceProvider } from 'alpheios-data-models'
import BaseAdapter from '@/adapters/base-adapter'

import Author from '@/adapters/concordance/lib/author'
import WordUsageExample from '@/adapters/concordance/lib/word-usage-example'

class AlpheiosConcordanceAdapter extends BaseAdapter {
  /**
   * Adapter uploads config data, creates provider and inits mapLangUri (Object for storing data for available languages)
   * @param {Object} config - properties with higher priority
  */
  constructor (config = {}) {
    super()
    this.config = this.uploadConfig(config, DefaultConfig)
    this.provider = new ResourceProvider(this.config.url, this.config.rights)
    this.authors = []
  }

  async getAuthorsWorks (config = {}) {
    this.authorWorkData = await this.uploadConfig(config, AuthorWorkConfigConfig)

    this.authors = []
    for (let authorWorkDataItem of Object.values(this.authorWorkData.authors)) {
      let author = Author.create(authorWorkDataItem)
      this.authors.push(author)
    }
    return this.authors
  }

  async getWordUsageExamples (homonym, filters = {}, pagination = {}, sort = {}) {
    try {
      let url = this.createFetchURL(homonym, filters, pagination, sort)
      console.info('**********url', url)
      let wordUsageListRes = await this.fetch(url)
      // console.info('*****************wordUsageList', wordUsageListRes)
      let parsedWordUsageList = this.parseWordUsageResult(wordUsageListRes, homonym, filters.author, filters.textWork)
      // console.info('*****************parsedWordUsageList', parsedWordUsageList)
      return parsedWordUsageList
    } catch (error) {
      console.info('**************error', error)
      // this.addError(this.l10n.messages['TRANSLATION_UNKNOWN_ERROR'].get(error.message))
    }
  }

  createFetchURL (homonym, filters, pagination, sort) {
    let filterFormatted = this.formatFilter(filters)
    let paginationFormatted = this.formatPagination(pagination)

    return `${this.config.url}${homonym.targetWord}${filterFormatted}${paginationFormatted}`
  }

  formatFilter (filters) {
    if (filters.author) {
      if (filters.textWork) {
        return `[${filters.author.ID}:${filters.textWork.ID}]`
      }
      return `[${filters.author.ID}]`
    }
    return ''
  }

  formatPagination (pagination) {
    if (pagination && pagination.property && pagination.value) {
      return `?${pagination.property}=${pagination.value}`
    }
    return ''
  }

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

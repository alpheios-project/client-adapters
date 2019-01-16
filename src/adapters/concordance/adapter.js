import DefaultConfig from '@/adapters/concordance/config.json'

import { ResourceProvider } from 'alpheios-data-models'
import BaseAdapter from '@/adapters/base-adapter'

class AlpheiosConcordanceAdapter extends BaseAdapter {
  /**
   * Adapter uploads config data, creates provider and inits mapLangUri (Object for storing data for available languages)
   * @param {Object} config - properties with higher priority
  */
  constructor (config = {}) {
    super()
    this.config = this.uploadConfig(config, DefaultConfig)
    this.provider = new ResourceProvider(this.config.url, this.config.rights)
  }

  async getWordUsageExamples (homonym, filterProperties = {}, sortProperties = {}, paginationProperties = {}) {
    try {
      let filterFormatted = '400:1'
      let paginationFormatted = 'max=5'

      let url = `${this.config.url}${homonym.targetWord}[${filterFormatted}]?${paginationFormatted}`
      console.info('**********url', url)
      let wordUsageList = await this.fetch(url, { axios: true })
      console.info('*****************wordUsageList', wordUsageList)
      return wordUsageList
    } catch (error) {
      console.info('**************error', error)
      // this.addError(this.l10n.messages['TRANSLATION_UNKNOWN_ERROR'].get(error.message))
    }
  }
}

export default AlpheiosConcordanceAdapter

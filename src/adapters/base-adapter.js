import axios from 'axios'
import AdapterError from '@/errors/adapter-error'

import L10n from '@/l10n/l10n'
import Locales from '@/locales/locales.js'
import enUS from '@/locales/en-us/messages.json'
import enGB from '@/locales/en-gb/messages.json'

class BaseAdapter {
  /*
   * Every adapter has errors array and L10n property for localizing messages
  */
  constructor () {
    this.errors = []
    this.l10n = new L10n()
      .addMessages(enUS, Locales.en_US)
      .addMessages(enGB, Locales.en_GB)
      .setLocale(Locales.en_US)
  }

  /*
   * This method is used for adding error meassage with additional data
   * @param {message} [String] - message text for the error
  */
  addError (message) {
    let error = new AdapterError(this.config.category, this.config.adapterName, this.config.method, message)
    this.errors.push(error)
  }

  /*
   * This method is used for uploding config property from current properties and default properties
   * @param {config} Object - properties with higher priority
   * @param {defaultConfig} Object - default properties
  */
  uploadConfig (config, defaultConfig) {
    let configRes = {}
    Object.keys(config).forEach(configKey => {
      configRes[configKey] = config[configKey]
    })

    Object.keys(defaultConfig).forEach(configKey => {
      if (configRes[configKey] === undefined) {
        configRes[configKey] = defaultConfig[configKey]
      }
    })

    return configRes
  }

  /*
   * This method is used for creating timeout Promise
   * @param {ms} Number - amount of ms for creation timeout
  */
  timeout (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /*
   * This method is used for fetching data using window.fetch
   * @param {url} String - url for fetching data
   * @param {options} Object
   *     @param {options.type} String - json is default, also it could be xml. This property defines output format.
   *                                    xml - response.text(), otherwise - response.json()
  */
  async fetchWindow (url, options = { type: 'json' }) {
    if (url) {
      try {
        let response = await window.fetch(url)
        if (!response.ok) {
          this.addError(this.l10n.messages['BASIC_ADAPTER_URL_RESPONSE_FAILED'].get(response.status, response.statusText))
          return
        }
        if (options.type === 'xml') {
          return response.text()
        } else {
          return response.json()
        }
      } catch (error) {
        this.addError(this.l10n.messages['BASIC_ADAPTER_NO_DATA_FROM_URL'].get(url))
      }
    } else {
      this.addError(this.l10n.messages['BASIC_ADAPTER_EMPTY_URL'])
    }
  }

  /*
   * This method is used for fetching data using window.fetch with timeout reject
   * @param {url} String - url for fetching data
   * @param {options} Object
   *     @param {options.type} String - json is default, also it could be xml. This property defines output format.
   *                                    xml - response.text(), otherwise - response.json()
   *     @param {options.timeout} Number - timeout ms amount
  */
  fetchWindowTimeout (url, options) {
    if (url) {
      let didTimeOut = false
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          didTimeOut = true
          reject(new Error('Request timed out', url))
        }, options.timeout)

        window.fetch(url)
          .then((response) => {
            clearTimeout(timeout)
            if (!didTimeOut) {
              if (options.type === 'xml') {
                resolve(response.text())
              } else {
                resolve(response.json())
              }
            }
          })
          .catch((err) => {
            console.log('fetch failed! ', err)
            // Rejection already happened with setTimeout
            if (didTimeOut) return
            // Reject with error
            reject(err)
          })
      })
    }
  }

  /*
   * This method is used for fetching data using axios
   * @param {url} String - url for fetching data
   * @param {options} Object
   *     @param {options.timeout} Number - timeout ms amount
  */
  async fetchAxios (url, options) {
    try {
      let res
      if (options && options.timeout > 0) {
        res = await axios.get(encodeURI(url), { timeout: options.timeout })
      } else {
        res = await axios.get(encodeURI(url))
      }
      return res.data
    } catch (error) {
      this.addError(this.l10n.messages['BASIC_ADAPTER_NO_DATA_FROM_URL'].get(url))
    }
  }

  /*
   * This method is used for fetching data using different methods. If window is defined - than it would be used window.fetch.
   * Otherwise axios would be used.
   * @param {url} String - url for fetching data
   * @param {options} Object
   *     @param {options.type} String - json is default, also it could be xml. This property defines output format.
   *                                    xml - response.text(), otherwise - response.json()
   *     @param {options.timeout} Number - timeout ms amount
  */
  async fetch (url, options) {
    let res

    try {
      if (typeof window !== 'undefined') {
        if (options && options.timeout > 0) {
          res = await this.fetchWindowTimeout(url, options)
        } else {
          res = await this.fetchWindow(url, options)
        }
      } else {
        res = await this.fetchAxios(url, options)
      }

      return res
    } catch (error) {
      this.addError(this.l10n.messages['BASIC_ADAPTER_UNKNOWN_ERROR'].get(error.message))
    }
  }
}

export default BaseAdapter

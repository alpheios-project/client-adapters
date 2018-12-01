import { LanguageModelFactory as LMF, Definition, ResourceProvider } from 'alpheios-data-models'
import papaparse from 'papaparse'

import BaseAdapter from '@/adapters/base-adapter'
import DefaultConfig from '@/adapters/lexicons/config.json'

let cachedDefinitions = new Map()

class AlpheiosLexiconsAdapter extends BaseAdapter {
  constructor (config = {}) {
    super()
    this.config = this.uploadConfig(config, DefaultConfig)
    this.options = { timeout: this.config.timeout ? this.config.timeout : 0 }
    this.data = null
  }

  async fetchShortDefs (homonym, options = {}) {
    let res = await this.fetchDefinitions(homonym, options, 'short')
    return res
  }

  async fetchFullDefs (homonym, options = {}) {
    let res = await this.fetchDefinitions(homonym, options, 'full')
    return res
  }

  async fetchDefinitions (homonym, options, lookupFunction) {
    Object.assign(this.options, options)
    if (!this.options.allow || this.options.allow.length === 0) {
      this.addError(this.l10n.messages['LEXICONS_NO_ALLOWED_URL'])
      return
    }
    let languageID = homonym.lexemes[0].lemma.languageID
    let urlKeys = this.getRequests(languageID).filter(url => this.options.allow.includes(url))

    let defRes = false
    for (let urlKey of urlKeys) {
      if (lookupFunction === 'short') {
        let url = this.config[urlKey].urls.short
        let res = await this.checkCachedData(url)
        if (!res) {
          continue
        }
        res = await this.updateShortDefs(languageID, cachedDefinitions.get(url), homonym, this.config[urlKey])

        defRes = defRes || res
      }
      if (lookupFunction === 'full') {
        let url = this.config[urlKey].urls.index
        await this.checkCachedData(url)
        let fullDefsRequests = this.collectFullDefURLs(languageID, cachedDefinitions.get(url), homonym, this.config[urlKey])
        if (fullDefsRequests) {
          let res = await this.updateFullDefs(fullDefsRequests, this.config[urlKey])
          defRes = defRes || res
        }
      }
    }
    return defRes
  }

  async checkCachedData (url) {
    if (!cachedDefinitions.has(url)) {
      try {
        let unparsed = await this.fetch(url, { type: 'xml', timeout: this.options.timeout })
        let parsed = papaparse.parse(unparsed, { quoteChar: '\u{0000}', delimiter: '|' })
        let data = this.fillMap(parsed.data)
        cachedDefinitions.set(url, data)
      } catch (error) {
        this.addError(this.l10n.messages['LEXICONS_FAILED_CACHED_DATA'].get(error.message))
        return false
      }
    }
    return true
  }

  async updateShortDefs (languageID, data, homonym, config) {
    let model = LMF.getLanguageModel(languageID)
    let finalRes = false

    for (let lexeme of homonym.lexemes) {
      let deftexts = this.lookupInDataIndex(data, lexeme.lemma, model)

      if (deftexts) {
        for (let d of deftexts) {
          try {
            let def = new Definition(d, config.langs.target, 'text/plain', lexeme.lemma.word)
            let definition = await ResourceProvider.getProxy(this.provider, def)
            lexeme.meaning['appendShortDefs'](definition)
            finalRes = true
          } catch (error) {
            this.addError(this.l10n.messages['LEXICONS_FAILED_APPEND_DEFS'].get(error.message))
            continue
          }
        }
      }
    }

    return finalRes
  }

  collectFullDefURLs (languageID, data, homonym, config) {
    let model = LMF.getLanguageModel(languageID)
    let urlFull = config.urls.full

    if (!urlFull) {
      this.addError(this.l10n.messages['LEXICONS_NO_FULL_URL'])
      return
    }

    let requests = []
    for (let lexeme of homonym.lexemes) {
      let ids = this.lookupInDataIndex(data, lexeme.lemma, model)
      if (urlFull && ids) {
        for (let id of ids) {
          requests.push({ url: `${urlFull}&n=${id}`, lexeme: lexeme })
        }
      } else if (urlFull) {
        requests.push({ url: `${urlFull}&l=${lexeme.lemma.word}`, lexeme: lexeme })
      }
    }
    return requests
  }

  async updateFullDefs (fullDefsRequests, config) {
    let finalRes = false

    for (let request of fullDefsRequests) {
      let fullDefData = await this.fetch(request.url, { type: 'xml' })
      if (!fullDefData) {
        this.addError(this.l10n.messages['LEXICONS_NO_DATA_FROM_URL'].get(request.url))
        continue
      }
      try {
        let def = new Definition(fullDefData, config.langs.target, 'text/plain', request.lexeme.lemma.word)
        let definition = await ResourceProvider.getProxy(this.provider, def)
        request.lexeme.meaning['appendFullDefs'](definition)
        finalRes = true
      } catch (error) {
        this.addError(this.l10n.messages['LEXICONS_FAILED_APPEND_DEFS'].get(error.message))
        continue
      }
    }

    return finalRes
  }

  getRequests (languageID) {
    let languageCode = LMF.getLanguageCodeFromId(languageID)
    return Object.keys(this.config).filter(url => this.config[url].langs && this.config[url].langs.source === languageCode)
  }

  /**
   * fills the data map with the rows from the parsed file
   * we need a method to do this because there may be homonyms in
   * the files
   * @param {string[]} rows
   * @return {Map} the filled map
   */
  fillMap (rows) {
    let data = new Map()
    for (let row of rows) {
      if (data.has(row[0])) {
        data.get(row[0]).push(row[1])
      } else {
        data.set(row[0], [ row[1] ])
      }
    }
    return data
  }

  /**
   * Lookup a Lemma object in an Alpheios v1 data index
   * @param {Map} data the data inddex
   * @param {Lemma} lemma the lemma to lookupInDataIndex
   * @param {LanguageModel} model a language model for language specific methods
   * @return {string} the index entry as a text string
   */
  lookupInDataIndex (data, lemma, model) {
    // legacy behavior from Alpheios lemma data file indices
    // first look to see if we explicitly have an instance of this lemma
    // with capitalization retained
    let found

    let alternatives = []
    let altEncodings = []
    for (let l of [lemma.word, ...lemma.principalParts]) {
      alternatives.push(l)
      for (let a of model.alternateWordEncodings(l)) {
        // we gather altEncodings separately because they should
        // be tried last after the lemma and principalParts in their
        // original form
        altEncodings.push(a)
      }
      let nosense = l.replace(/_?\d+$/, '')
      if (l !== nosense) {
        alternatives.push(nosense)
      }
    }
    alternatives = [...alternatives, ...altEncodings]

    for (let lookup of alternatives) {
      found = data.get(lookup.toLocaleLowerCase())
      if (found && found.length === 1 && found[0] === '@') {
        found = data.get(`@${lookup}`)
      }
      if (found) {
        break
      }
    }
    return found
  }
}

export default AlpheiosLexiconsAdapter

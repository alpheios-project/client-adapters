/* eslint-env jest */
/* eslint-disable no-unused-vars */
import 'whatwg-fetch'
import AlpheiosLexiconsAdapter from '@/adapters/lexicons/adapter'
import ClientAdapters from '@/client-adapters.js'
import { Constants, Homonym, Lexeme, Lemma } from 'alpheios-data-models'

describe('lexicons/adapter.test.js', () => {
  console.error = function () {}
  console.log = function () {}
  console.warn = function () {}

  let testSuccessHomonym, testFailedHomonym

  beforeAll(async () => {
    ClientAdapters.init()
    let homonymRes1 = await ClientAdapters.maAdapter({
      method: 'getHomonym',
      params: {
        languageID: Constants.LANG_GREEK,
        word: 'μύες'
      }
    })
    testSuccessHomonym = homonymRes1.result
    let formLexeme = new Lexeme(new Lemma('ινώδους', Constants.LANG_GREEK), [])
    testFailedHomonym = new Homonym([formLexeme], 'ινώδους')
  })
  beforeEach(() => {
    jest.spyOn(console, 'error')
    jest.spyOn(console, 'log')
    jest.spyOn(console, 'warn')
  })
  afterEach(() => {
    jest.resetModules()
  })
  afterAll(() => {
    jest.clearAllMocks()
  })

  function timeout (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  it('1 AlpheiosLexiconsAdapter - constructor uploads config and options', () => {
    let adapter = new AlpheiosLexiconsAdapter({
      category: 'lexicon',
      adapterName: 'alpheios',
      method: 'fetchFullDefs'
    })

    expect(adapter.errors).toEqual([])
    expect(adapter.l10n).toBeDefined()
    expect(adapter.config).toBeDefined()
    expect(adapter.options).toBeDefined()
    expect(adapter.options.timeout).toBeDefined()
  })

  it('2 AlpheiosLexiconsAdapter - fetchShortDefs executes fetchDefinitions with lookupFunction = short', () => {
    let adapter = new AlpheiosLexiconsAdapter({
      category: 'lexicon',
      adapterName: 'alpheios',
      method: 'fetchShortDefs'
    })

    adapter.fetchDefinitions = jest.fn()

    adapter.fetchShortDefs('fooHomonym')
    expect(adapter.fetchDefinitions).toHaveBeenCalledWith('fooHomonym', {}, 'short')
  })

  it('3 AlpheiosLexiconsAdapter - fetchFullDefs executes fetchDefinitions with lookupFunction = full', () => {
    let adapter = new AlpheiosLexiconsAdapter({
      category: 'lexicon',
      adapterName: 'alpheios',
      method: 'fetchFullDefs'
    })

    adapter.fetchDefinitions = jest.fn()

    adapter.fetchFullDefs('fooHomonym')
    expect(adapter.fetchDefinitions).toHaveBeenCalledWith('fooHomonym', {}, 'full')
  })

  it('4 AlpheiosLexiconsAdapter - prepareShortDefPromise, if success - it executes updateShortDefs, prepareSuccessCallback', async () => {
    let adapter = new AlpheiosLexiconsAdapter({
      category: 'lexicon',
      adapterName: 'alpheios',
      method: 'fetchShortDefs'
    })

    let urlKey = 'https://github.com/alpheios-project/lsj'
    let url = adapter.config[urlKey].urls.short
    await adapter.checkCachedData(url)

    jest.spyOn(adapter, 'updateShortDefs')
    adapter.prepareSuccessCallback = jest.fn()

    adapter.prepareShortDefPromise(testSuccessHomonym, urlKey)
    let timeoutRes = await timeout(5000)

    expect(adapter.updateShortDefs).toHaveBeenCalled()
    expect(adapter.prepareSuccessCallback).toHaveBeenCalled()
    return timeoutRes
  }, 25000)

  

})
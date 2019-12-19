/* eslint-env jest */
/* eslint-disable no-unused-vars */
import 'whatwg-fetch'

import ClientAdapters from '@/client-adapters.js'
import Fixture from '@tests/fixture/fixture.js'

import { Constants, Homonym, Author, WordUsageExample } from 'alpheios-data-models'

describe('client-adapters.test.js', () => {
  /*
  console.error = function () {}
  console.log = function () {}
  console.warn = function () {}
  */
  beforeEach(() => {
    jest.spyOn(console, 'error')
    jest.spyOn(console, 'log')
    jest.spyOn(console, 'warn'
    )
  })
  afterEach(() => {
    jest.resetModules()
  })
  afterAll(() => {
    jest.clearAllMocks()
  })

  it('Test Morph Fixture', async () => {

    ClientAdapters.init()
  
    let sourceJson = Fixture.getFixtureRes({
      langCode: 'lat', adapter: 'tufts', word: 'foo'
    })

    console.info(sourceJson)
    let res = await ClientAdapters.maAdapter({
      method: 'getHomonym',
      params: {
        languageID: Constants.LANG_LATIN,
        word: 'foo'
      },
      sourceData: sourceJson
    })
    if (sourceJson) {
      console.info('From Fixture - lexemes length - ', res.result)
    } else {
      console.info('From Remote Service - lexemes length - ', res.result.lexemes.length)
    }
    

  })
})
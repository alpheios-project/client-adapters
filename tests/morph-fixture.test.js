/* eslint-env jest */
/* eslint-disable no-unused-vars */
import 'whatwg-fetch'
import parser from 'fast-xml-parser'

import ClientAdapters from '@/client-adapters.js'

import { Constants, Homonym, Author, WordUsageExample } from 'alpheios-data-models'
// import testData from '@/localJson/lat-morph-whitakerLat-palmaque.xml'
import testData from '@/localJson/lat-morph-whitakerLat-mare.xml'

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
    
    const options = {
      ignoreNameSpace : true,
      ignoreAttributes : false,
      attributeNamePrefix : "",
      textNodeName : "$"
    }
    const testJson = parser.parse(testData, options)
    console.info('testJson - ', testJson)
    /*
    let res = await ClientAdapters.maAdapter({
      method: 'getHomonym',
      params: {
        languageID: Constants.LANG_LATIN,
        word: 'mare'
      },
      sourceData: testJson
    })
    console.info(res.result)
    */
  })
})
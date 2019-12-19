/* eslint-env jest */
/* eslint-disable no-unused-vars */
import 'whatwg-fetch'
import parser from 'fast-xml-parser'

import ClientAdapters from '@/client-adapters.js'

import { Constants, Homonym, Author, WordUsageExample } from 'alpheios-data-models'
import testData from '@/localJson/lat-morph-whitakerLat-palmaque.xml'
// import testData from '@/localJson/lat-morph-whitakerLat-mare.xml'

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
    testJson.RDF.Annotation.Body.forEach(bodyItem => {
      // console.info('rest - ', rest)
      if (bodyItem.rest.entry && bodyItem.rest.entry.infl.term && bodyItem.rest.entry.infl.term.stem) {
        bodyItem.rest.entry.infl.term.stem = { '$': bodyItem.rest.entry.infl.term.stem }
      }
      if (bodyItem.rest.entry && bodyItem.rest.entry.infl.term && bodyItem.rest.entry.infl.term.suff) {
        bodyItem.rest.entry.infl.term.suff = { '$': bodyItem.rest.entry.infl.term.suff }
      }
      if (bodyItem.rest.entry && bodyItem.rest.entry.infl.term && bodyItem.rest.entry.infl.term.pref) {
        bodyItem.rest.entry.infl.term.pref = { '$': bodyItem.rest.entry.infl.term.pref }
      }

      if (bodyItem.rest.entry && bodyItem.rest.entry.xmpl) {
        bodyItem.rest.entry.xmpl = { '$': bodyItem.rest.entry.xmpl }
      }
    })
    // console.info('testJson - ', testJson.RDF.Annotation.Body[0].rest.entry.infl)
    
    let res = await ClientAdapters.maAdapter({
      method: 'getHomonym',
      params: {
        languageID: Constants.LANG_LATIN,
        word: 'palmaque'
      },
      sourceData: testJson
    })
    console.info(res.result.lexemes[0].lemma)
    
  })
})
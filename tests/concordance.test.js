/* eslint-env jest */
/* eslint-disable no-unused-vars */
import 'whatwg-fetch'
import { Constants } from 'alpheios-data-models'

import ClientAdapters from '@/client-adapters.js'
import AlpheiosConcordanceAdapter from '@/adapters/concordance/adapter.js'
import Author from '@/adapters/concordance/lib/author'
import TextWork from '@/adapters/concordance/lib/text-work'
import WordUsageExample from '@/adapters/concordance/lib/word-usage-example'

describe('concordance.test.js', () => {
  console.error = function () {}
  console.log = function () {}
  console.warn = function () {}

  let testAuthor = new Author('urn:cts:latinLit:phi0690', { "eng": "Virgil" })
  let testTextWork = new TextWork(testAuthor, 'urn:cts:latinLit:phi0690.phi003', { "eng": "Aeneid" })
  let testWord1 = 'submersasque'
  let testWord2 = 'regemque'
  let testWord3 = 'magno'

  let defaultPagination = 5
  let testHomonym1, testHomonym2, testHomonym3

  beforeAll(async () => {
    let testHomonymRes1 = await ClientAdapters.morphology.tufts({
      method: 'getHomonym',
      params: {
        languageID: Constants.LANG_LATIN,
        word: testWord1
      }
    })

    testHomonym1 = testHomonymRes1.result
    // console.info('***************testHomonym1', testHomonym1)

    let testHomonymRes2 = await ClientAdapters.morphology.tufts({
      method: 'getHomonym',
      params: {
        languageID: Constants.LANG_LATIN,
        word: testWord2
      }
    })

    testHomonym2 = testHomonymRes2.result
    // console.info('***************testHomonym2', testHomonym2)

    let testHomonymRes3 = await ClientAdapters.morphology.tufts({
      method: 'getHomonym',
      params: {
        languageID: Constants.LANG_LATIN,
        word: testWord3
      }
    })

    testHomonym3 = testHomonymRes3.result
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

  it.skip('1 ConcordanceService - getAuthorsWorks returns a list of author with a list of Works', async () => {
    let adapter = new AlpheiosConcordanceAdapter({
      category: 'wordUsage',
      adapterName: 'concordance',
      method: 'getAuthorsWorks'
    })

    let authors = await adapter.getAuthorsWorks()
    let timeoutRes = await timeout(3000)

    let testAuthor = {
      title: 'Ovid',
      ID: 959
    }
    
    let testWork = {
      title: 'The Art of Love',
      ID: 1
    }

    expect(Array.isArray(authors)).toBeTruthy()

    expect(authors.map(item => item.title).includes(testAuthor.title)).toBeTruthy()
    
    let testAuthorObj = authors.filter(item => item.title === testAuthor.title)[0]   
    expect(testAuthorObj.ID).toEqual(testAuthor.ID)

    expect(Array.isArray(testAuthorObj.works)).toBeTruthy()

    expect(testAuthorObj.works.map(item => item.title).includes(testWork.title)).toBeTruthy()
    expect(testAuthorObj.works.filter(item => item.title === testWork.title)[0].ID).toEqual(testWork.ID)

    expect(adapter.errors.length).toEqual(0)

    return timeoutRes
  }, 50000)

  it('2 ConcordanceService - getWordUsageExamples returns a list of text links with filter by authorID, textID', async () => {
    let adapter = new AlpheiosConcordanceAdapter({
      category: 'wordUsage',
      adapterName: 'concordance',
      method: 'getWordUsageExamples'
    })

    let filterOptions = {
      author: testAuthor,
      textWork: testTextWork
    }

    let paginationOptions =  {
      property: 'max',
      value: defaultPagination
    }

    // console.info('**********************filterFormatted', testAuthor, testAuthor.ID, filterFormatted)
    let res1 = await adapter.getWordUsageExamples(testHomonym1, filterOptions, paginationOptions) // single usage

    expect(Array.isArray(res1)).toBeTruthy()
    expect(res1.length).toEqual(1)

    expect(res1[0]).toBeInstanceOf(WordUsageExample)

    let res2 = await adapter.getWordUsageExamples(testHomonym2, filterOptions, paginationOptions) // multiple usage

    expect(Array.isArray(res2)).toBeTruthy()
    expect(res2.length).toEqual(5)

    expect(res2[0]).toBeInstanceOf(WordUsageExample)

    // multiple usage in different texts of the same author - 1 case - filter by author and text, no pagination
    let res3 = await adapter.getWordUsageExamples(testHomonym3, filterOptions) 

    // console.info('*******************res3', res3.length, res3[0])
    expect(Array.isArray(res3)).toBeTruthy()
    expect(res3.length).toEqual(62)

    expect(res3[0]).toBeInstanceOf(WordUsageExample)

    // multiple usage in different texts of the same author - 1 case - filter by author and text, with pagination
    let res4 = await adapter.getWordUsageExamples(testHomonym3, filterOptions, paginationOptions)
    expect(Array.isArray(res4)).toBeTruthy()
    expect(res4.length).toBeLessThanOrEqual(5)

    expect(res4[0]).toBeInstanceOf(WordUsageExample)

    // multiple usage in different texts of the same author - 1 case - filter by author, no pagination
    let filterOptionsOnlyAuthor = { author: filterOptions.author }
    let res5 = await adapter.getWordUsageExamples(testHomonym3, filterOptionsOnlyAuthor)
    expect(Array.isArray(res5)).toBeTruthy()
    expect(res5.length).toBeGreaterThan(res4.length)

    expect(res5[0]).toBeInstanceOf(WordUsageExample)

    // multiple usage in different texts of the same author - 1 case - no filter, no pagination
    let res6 = await adapter.getWordUsageExamples(testHomonym3)
    expect(Array.isArray(res6)).toBeTruthy()
    expect(res6.length).toBeGreaterThan(res5.length)

    expect(res6[0]).toBeInstanceOf(WordUsageExample)

    let timeoutRes = await timeout(3000)
    
    return timeoutRes
  }, 50000)
})

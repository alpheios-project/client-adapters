/* eslint-env jest */
/* eslint-disable no-unused-vars */
import 'whatwg-fetch'
import ClientAdapters from '@/client-adapters.js'
import AlpheiosConcordanceAdapter from '@/adapters/concordance/adapter.js'
import Author from '../src/adapters/concordance/lib/author'
import TextWork from '@/adapters/concordance/lib/text-work'

describe('concordance.test.js', () => {
  console.error = function () {}
  console.log = function () {}
  console.warn = function () {}

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

  let testAuthor = new Author('urn:cts:latinLit:phi0690', { "eng": "Virgil" })
  let testTextWork = new TextWork(testAuthor, 'urn:cts:latinLit:phi0690.phi003', { "eng": "Aeneid" })
  let testWord1 = 'submersasque'
  let defaultPagination = 5

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

    let testHomonym = { targetWord: testWord1 }
    // let filterFormatted = `${testAuthor.ID}:${testTextWork.ID}`
    // let paginationFormatted = `max=${defaultPagination}`

    let filterOptions = {
      author: testAuthor,
      textWork: testTextWork
    }

    let paginationOptions =  {
      property: 'max',
      value: defaultPagination
    }

    // console.info('**********************filterFormatted', testAuthor, testAuthor.ID, filterFormatted)
    let res = await adapter.getWordUsageExamples(testHomonym, filterOptions, paginationOptions)
    let timeoutRes = await timeout(3000)
    
    return timeoutRes
  }, 50000)
})

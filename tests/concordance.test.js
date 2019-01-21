/* eslint-env jest */
/* eslint-disable no-unused-vars */
import 'whatwg-fetch'
import { mount } from '@vue/test-utils'
import { Constants } from 'alpheios-data-models'

import ClientAdapters from '@/client-adapters.js'
import AlpheiosConcordanceAdapter from '@/adapters/concordance/adapter.js'
import Author from '@/adapters/concordance/lib/author'
import TextWork from '@/adapters/concordance/lib/text-work'
import WordUsageExample from '@/adapters/concordance/lib/word-usage-example'

import WordUsageExamplesBlock from '@/adapters/concordance/vue-components/word-usage-examples-block.vue'
import WordUsageExampleItem from '@/adapters/concordance/vue-components/word-usage-example-item.vue'

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

  function html2text( html ) {
    var d = document.createElement( 'div' );
    d.innerHTML = html;
    return d.textContent;
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

  it.skip('2 ConcordanceService - getWordUsageExamples returns a list of text links with filter by authorID, textID', async () => {
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

  it.skip('3 ConcordanceService - wordUsageExamplesBlock - shows all word usage examples', async () => {
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

    let resWordUsageList = await adapter.getWordUsageExamples(testHomonym2, filterOptions, paginationOptions)

    let cmp = mount(WordUsageExamplesBlock, {
      propsData: {
        wordUsageList: resWordUsageList,
        targetWord: testHomonym2.targetWord,
        language: testHomonym2.language
      }
    })
    expect(cmp.isVueInstance()).toBeTruthy()

    expect(cmp.contains('.alpheios_word_usage_list_title')).toBeTruthy()
    expect(cmp.find('.alpheios_word_usage_list_title').text()).toEqual(`${testHomonym2.targetWord} (${testHomonym2.language})`)

    expect(cmp.findAll('.alpheios_word_usage_list_item').length).toEqual(5)

    expect(cmp.vm.wordUsageList).toEqual(resWordUsageList)
    expect(cmp.vm.targetWord).toEqual(testHomonym2.targetWord)
    expect(cmp.vm.language).toEqual(testHomonym2.language)

    let timeoutRes = await timeout(3000)
    return timeoutRes
  }, 50000)

  it.skip('4 ConcordanceService - WordUsageExampleItem - shows details of one word usage example', async () => {
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

    let resWordUsageList = await adapter.getWordUsageExamples(testHomonym2, filterOptions, paginationOptions)

    let cmp = mount(WordUsageExampleItem, {
      propsData: {
        wordUsageItem: resWordUsageList[0]
      }
    })

    expect(cmp.isVueInstance()).toBeTruthy()
    expect(cmp.vm.wordUsageItem).toEqual(resWordUsageList[0])

    expect(cmp.find('.alpheios_word_usage_list_item__source').text()).toEqual(`${resWordUsageList[0].source} ${resWordUsageList[0].cit}`)
    expect(cmp.find('.alpheios_word_usage_list_item__text').element.textContent).toEqual(html2text(resWordUsageList[0].htmlExample))
    let timeoutRes = await timeout(3000)
    return timeoutRes
  }, 50000)
/*
  it('5 ConcordanceService - ClientAdapters - init correct adapter method', async () => {
    let adapterConcordanceRes = await ClientAdapters.wordusageExamples.alpheios({
      method: 'getAuthorsWorks',
      params: {}
    })
  })
*/
  it('5 ClientAdapters - wordusageExamples executes init and returns object with alpheios', () => {
    jest.spyOn(ClientAdapters, 'init')

    let concordanceRes = ClientAdapters.wordusageExamples

    expect(ClientAdapters.init).toHaveBeenCalled()
    expect(concordanceRes.concordance).toBeDefined()
    expect(concordanceRes.concordance).toBeInstanceOf(Function)
  })

  it('6 ClientAdapters - wordusageExamples - getAuthorsWorks returns array of authors with wordTexts', async () => {
    ClientAdapters.init()

    let res = await ClientAdapters.wordUsageExamples({
      method: 'getAuthorsWorks',
      params: {}
    })

    expect(res.errors).toEqual([])

    expect(Array.isArray(res.result)).toBeTruthy()
    for (let resItem of res.result) {
      expect(resItem).toBeInstanceOf(Author)
    }

    let adapterConcordanceRes = await ClientAdapters.wordusageExamples.concordance({
      method: 'getAuthorsWorks',
      params: {}
    })

    expect(res.result).toEqual(adapterConcordanceRes.result)
  })

  it('7 ClientAdapters - wordusageExamples - getWordUsageExamples returns array of wordUsageExample', async () => {
    ClientAdapters.init()

    let res = await ClientAdapters.wordUsageExamples({
      method: 'getWordUsageExamples',
      params: { homonym: testHomonym1 }
    })

    expect(res.errors).toEqual([])

    expect(Array.isArray(res.result)).toBeTruthy()
    for (let resItem of res.result) {
      expect(resItem).toBeInstanceOf(WordUsageExample)
    }

    let adapterConcordanceRes = await ClientAdapters.wordusageExamples.concordance({
      method: 'getWordUsageExamples',
      params: { homonym: testHomonym1 }
    })

    let i = 0
    for (let resItem of res.result) {
      expect(resItem.source).toEqual(adapterConcordanceRes.result[i].source)
      i++
    }
  })

})

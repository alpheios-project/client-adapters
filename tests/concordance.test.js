/* eslint-env jest */
/* eslint-disable no-unused-vars */
import 'whatwg-fetch'
import ClientAdapters from '@/client-adapters.js'
import AlpheiosConcordanceAdapter from '@/adapters/concordance/adapter.js'

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

  function timeout (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  it('1 ConcordanceService - ', async () => {
    let adapter = new AlpheiosConcordanceAdapter({
      category: 'wordUsage',
      adapterName: 'concordance',
      method: 'getWordUsageExamples'
    })

    adapter.fetch = () => {
      return [
        {
          "link":"/loc/400/1/0/674-679",
          "cit":"Acc.poet.4.1",
          "left":"ut cum dominis famuli epulentur ibidem. fraxinus fixa ",
          "right":" infensa infunditur ossis. –⏔–⏔– ut quam fragilissimus",
          "target":"ferox"
        }
      ]
    }
    let res = await adapter.getWordUsageExamples({targetWord: 'ferox'})
    let timeoutRes = await timeout(3000)

    console.info('***********adapter.errors', adapter.errors)
    return res
  }, 50000)

})

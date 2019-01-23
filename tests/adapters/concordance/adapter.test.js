/* eslint-env jest */
/* eslint-disable no-unused-vars */
import 'whatwg-fetch'
import AlpheiosConcordanceAdapter from '@/adapters/concordance/adapter'

import { Author } from 'alpheios-data-models'

describe('concordance.test.js', () => {
  console.error = function () {}
  console.log = function () {}
  console.warn = function () {}

  beforeAll(async () => {
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

  it('1 AlpheiosConcordanceAdapter - constructor uploads config and options', () => {
    let adapter = new AlpheiosConcordanceAdapter({
      category: 'wordUsage',
      adapterName: 'concordance',
      method: 'getAuthorsWorks'
    })

    expect(adapter.errors).toEqual([])
    expect(adapter.config).toBeDefined()
    expect(adapter.authors).toEqual([])
  })

  it('2 AlpheiosConcordanceAdapter - getAuthorsWorks uploads json data with the list of authors with their textWorks and parses it in Author and TextWork objects', async () => {
    let adapter = new AlpheiosConcordanceAdapter({
      category: 'wordUsage',
      adapterName: 'concordance',
      method: 'getAuthorsWorks'
    })

    jest.spyOn(adapter, 'uploadConfig')

    let result = await adapter.getAuthorsWorks()
    let testAuthorJson = { "urn": "urn:cts:latinLit:phi0690",
      "title": [
          { "@lang": "eng",
            "@value": "Virgil"
          }
      ],
      "works": [
        { "urn": "urn:cts:latinLit:phi0690.phi003",
          "title": [
            { "@lang":"lat",
              "@value": "Aeneid"
            },
            { "@lang":"eng",
              "@value": "Aeneid"
            }
          ]
        }
      ]
    }
    let checkAuthorItem = Author.create(testAuthorJson)

    expect(adapter.uploadConfig).toHaveBeenCalled()
    expect(adapter.errors.length).toEqual(0)
    expect(Array.isArray(result)).toBeTruthy()
    expect(result.filter(author => author.ID === checkAuthorItem.ID).length).toEqual(1)
  })

  it('3 AlpheiosConcordanceAdapter - getWordUsageExamples method fetches data from concordance API and converts it to WordUsageExamplesObject', async () => {
    let adapter = new AlpheiosConcordanceAdapter({
      category: 'wordUsage',
      adapterName: 'concordance',
      method: 'getAuthorsWorks'
    })
    
  })
})
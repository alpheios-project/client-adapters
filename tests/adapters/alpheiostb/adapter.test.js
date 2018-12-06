/* eslint-env jest */
/* eslint-disable no-unused-vars */
import 'whatwg-fetch'
import AlpheiosTreebankAdapter from '@/adapters/alpheiostb/adapter'
import { Constants, Homonym } from 'alpheios-data-models'

describe('alpheiostb/adapter.test.js', () => {
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

  it('1 AlpheiosTreebankAdapter - constructor uploads config, creates engines and enginesSet', () => {
    let adapter = new AlpheiosTreebankAdapter({
      category: 'morphology',
      adapterName: 'alpheiosTreebank',
      method: 'getHomonym'
    })

    expect(adapter.errors).toEqual([])
    expect(adapter.l10n).toBeDefined()
    expect(adapter.config).toBeDefined()
    expect(adapter.models).toBeDefined()
  })

  it('3 AlpheiosTreebankAdapter - getHomonym executes prepareRequestUrl and if url could not be constructed return undefined and adds error', async () => {
    let adapter = new AlpheiosTreebankAdapter({
      category: 'morphology',
      adapterName: 'alpheiosTreebank',
      method: 'getHomonym'
    })

    expect(adapter.errors.length).toEqual(0)

    adapter.prepareRequestUrl = jest.fn()
    let res = await adapter.getHomonym(Constants.LANG_LATIN, 'phi0959.phi006.alpheios-text-lat1#1-2')

    expect(adapter.prepareRequestUrl).toHaveBeenCalled()
    expect(adapter.errors.length).toEqual(1)
    expect(res).toBeUndefined()
  })

  it('4 AlpheiosTreebankAdapter - getHomonym returns undefined if url doesn\'t return answer and adds error', async () => {
    let adapter = new AlpheiosTreebankAdapter({
      category: 'morphology',
      adapterName: 'alpheiosTreebank',
      method: 'getHomonym'
    })
    expect(adapter.errors.length).toEqual(0)

    let res = await adapter.getHomonym(Constants.LANG_LATIN, '1-22')
    expect(adapter.errors.length).toEqual(1)
    expect(res).toBeUndefined()
  }, 20000)

  it('5 AlpheiosTreebankAdapter - getHomonym returns homonym if url returns correct answer', async () => {
    let adapter = new AlpheiosTreebankAdapter({
      category: 'morphology',
      adapterName: 'alpheiosTreebank',
      method: 'getHomonym'
    })

    let res = await adapter.getHomonym(Constants.LANG_LATIN, 'phi0959.phi006.alpheios-text-lat1#1-2')
    expect(res).toBeInstanceOf(Homonym)
  }, 20000)

  it('6 AlpheiosTreebankAdapter - prepareRequestUrl returns undefined if wordref is not correctly defined', async () => {
    let adapter = new AlpheiosTreebankAdapter({
      category: 'morphology',
      adapterName: 'alpheiosTreebank',
      method: 'getHomonym'
    })

    let res = adapter.prepareRequestUrl('1-2')
    expect(res).toBeUndefined()
  })

  it('7 AlpheiosTreebankAdapter - prepareRequestUrl returns url if wordref is defined correctly', async () => {
    let adapter = new AlpheiosTreebankAdapter({
      category: 'morphology',
      adapterName: 'alpheiosTreebank',
      method: 'getHomonym'
    })

    let res = adapter.prepareRequestUrl('phi0959.phi006.alpheios-text-lat1#1-2')
    expect(res).toEqual(expect.stringMatching(/tools.alpheios.net\/exist/))
  })
})

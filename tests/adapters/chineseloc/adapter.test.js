/* eslint-env jest */
/* eslint-disable no-unused-vars */
import 'whatwg-fetch'

import AlpheiosChineseLocAdapter from '@/adapters/chineseloc/adapter'

import { Constants, Feature } from 'alpheios-data-models'

describe('chineseloc.test.js', () => {
  console.error = function () {}
  console.log = function () {}
  console.warn = function () {}

  // A stub that imitates LexisCS CEDICT service response
  const sendRequestToStub = async (destName, request) => {
    // If no records are found for the target word, CEDICT service will return an empty object
    let body = {}
    const targetWord = request.body.getWords.words[0]

    if (targetWord === '而今') {
      body = {
        traditional: {
          [targetWord]: [
            {
              index: 83686,
              type: 'not specified',
              traditional: {
                headword: '而今'
              },
              simplified: {
                headword: '而今'
              },
              pinyin: 'er2 jin1',
              definitions: [
                'now',
                'at the present (time)'
              ]
            }
          ]
        }
      }
    }

    if (targetWord === '眠') {
      body = {
        traditional: {
          [targetWord]: [
            {
              index: 73893,
              type: 'not specified',
              traditional: {
                headword: '眠',
                cantonese: 'min4',
                mandarin: 'mián',
                tang: '*men',
                codePoint: 'U+7720',
                radical: {
                  index: 109,
                  additionalStrokes: 5,
                  character: '目'
                },
                frequency: 4,
                totalStrokes: 10
              },
              simplified: {
                headword: '眠',
                cantonese: 'min4',
                mandarin: 'mián',
                tang: '*men',
                codePoint: 'U+7720',
                radical: {
                  index: 109,
                  additionalStrokes: 5,
                  character: '目'
                },
                frequency: 4,
                totalStrokes: 10
              },
              pinyin: 'mian2',
              definitions: [
                'to sleep',
                'to hibernate'
              ]
            }
          ]
        }
      }
    }
    return { body }
  }

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

  it('1 AlpheiosChineseLocAdapter - constructor uploads config and options', () => {
    // eslint-disable-next-line prefer-const
    let adapter = new AlpheiosChineseLocAdapter({
      category: 'morphology',
      adapterName: 'chineseloc',
      method: 'getHomonym'
    })

    expect(adapter.errors).toEqual([])
    expect(adapter.config).toBeDefined()
    expect(adapter.languageID).toEqual(Constants.LANG_CHINESE)
  })

  it('2 AlpheiosChineseLocAdapter - method fetchChineseData retrieves raw data from chinese local source', async () => {
    // eslint-disable-next-line prefer-const
    let adapter = new AlpheiosChineseLocAdapter({
      category: 'morphology',
      adapterName: 'chineseloc',
      method: 'getHomonym'
    })

    const result = await adapter.fetchChineseData('而今')

    expect(result.length).toEqual(1)
    expect(result[0].dictEntry).toEqual('而今')
    expect(result[0].pinyin).toEqual('ér jin')
    expect(result[0].shortDef).toEqual('now; at the present (time)')
    expect(result[0].format).toEqual('simplified')
    expect(result[0].mandarin).toEqual('mandarin - ér  néng')
    expect(result[0].cantonese).toEqual('cantonese - ji4')
    expect(result[0].tang).toEqual('tang - *njiə')
    expect(result[0].frequency).toEqual('least frequent')
    expect(result[0].unicode).toEqual('而')
  })

  it('3 AlpheiosChineseLocAdapter: getHomonym with a single-character word returns homonym if fetch was successful', async () => {
    // eslint-disable-next-line prefer-const
    let adapter = new AlpheiosChineseLocAdapter({
      category: 'morphology',
      adapterName: 'chineseloc',
      method: 'getHomonym'
    })
    // Stub the messaging service method
    adapter._messagingService.sendRequestTo = sendRequestToStub

    const homonym = await adapter.getHomonym('眠')

    expect(homonym).toBeDefined()

    expect(homonym.lexemes.length).toEqual(1)
    expect(homonym.targetWord).toEqual('眠')

    expect(homonym.lexemes[0].lemma.languageID).toEqual(Constants.LANG_CHINESE)
    expect(homonym.lexemes[0].lemma.languageCode).toEqual(Constants.STR_LANG_CODE_ZHO)
    expect(homonym.lexemes[0].lemma.word).toEqual('眠')
    expect(homonym.lexemes[0].lemma.principalParts).toEqual([])
    expect(homonym.lexemes[0].lemma.features.pronunciation.values).toEqual(['tang - *men', 'mandarin - mián', 'cantonese - min4', 'mián'])
    expect(homonym.lexemes[0].lemma.features.note.value).toEqual('traditional')
    expect(homonym.lexemes[0].lemma.features.frequency.singleValue).toEqual(4)
    expect(homonym.lexemes[0].lemma.features.radical.value).toEqual('目')

    expect(homonym.lexemes[0].meaning.shortDefs.length).toEqual(2)
    expect(homonym.lexemes[0].meaning.shortDefs[0].text).toEqual('to sleep')
    expect(homonym.lexemes[0].meaning.shortDefs[1].text).toEqual('to hibernate')

    expect(adapter.errors.length).toEqual(0)
  })

  it('4 AlpheiosChineseLocAdapter - method getHomonym with a multi-character word returns homonym if fetch was successful', async () => {
    // eslint-disable-next-line prefer-const
    let adapter = new AlpheiosChineseLocAdapter({
      category: 'morphology',
      adapterName: 'chineseloc',
      method: 'getHomonym'
    })
    // Stub the messaging service method
    adapter._messagingService.sendRequestTo = sendRequestToStub

    const homonym = await adapter.getHomonym('而今')

    expect(homonym).toBeDefined()

    expect(homonym.lexemes.length).toEqual(1)
    expect(homonym.targetWord).toEqual('而今')

    expect(homonym.lexemes[0].lemma.languageID).toEqual(Constants.LANG_CHINESE)
    expect(homonym.lexemes[0].lemma.languageCode).toEqual(Constants.STR_LANG_CODE_ZHO)
    expect(homonym.lexemes[0].lemma.word).toEqual('而今')
    expect(homonym.lexemes[0].lemma.principalParts).toEqual([])
    expect(homonym.lexemes[0].lemma.features.pronunciation.values).toEqual(['ér jin'])
    expect(homonym.lexemes[0].lemma.features.note.value).toEqual('traditional')

    expect(homonym.lexemes[0].meaning.shortDefs.length).toEqual(2)
    expect(homonym.lexemes[0].meaning.shortDefs[0].text).toEqual('now')
    expect(homonym.lexemes[0].meaning.shortDefs[1].text).toEqual('at the present (time)')

    expect(adapter.errors.length).toEqual(0)
  })

  it('5 AlpheiosChineseLocAdapter - method getHomonym  returns undefined if fetch was not successfull and adds an error to adapter', async () => {
    // eslint-disable-next-line prefer-const
    let adapter = new AlpheiosChineseLocAdapter({
      category: 'morphology',
      adapterName: 'chineseloc',
      method: 'getHomonym'
    })

    const homonym = await adapter.getHomonym('FF')

    expect(homonym).not.toBeDefined()
    expect(adapter.errors.length).toEqual(1)
  })

  it('6 AlpheiosChineseLocAdapter - method extractFeatures executes methods to extract each feature from rawLexeme', () => {
    // eslint-disable-next-line prefer-const
    let adapter = new AlpheiosChineseLocAdapter({
      category: 'morphology',
      adapterName: 'chineseloc',
      method: 'getHomonym'
    })

    const rawLexemes = adapter.fetchChineseData('而今')

    adapter.defineMultipleFeature = jest.fn((val) => val.checkAttribute)
    adapter.defineSimpleFeature = jest.fn((val) => val.checkAttribute)

    const result = adapter.extractFeatures(rawLexemes[0])

    expect(result.length).toEqual(7)
    expect(adapter.defineMultipleFeature).toHaveBeenCalledWith(expect.objectContaining({ checkAttribute: 'tang' }), rawLexemes[0], expect.anything())
    expect(adapter.defineMultipleFeature).toHaveBeenCalledWith(expect.objectContaining({ checkAttribute: 'mandarin' }), rawLexemes[0], expect.anything())
    expect(adapter.defineMultipleFeature).toHaveBeenCalledWith(expect.objectContaining({ checkAttribute: 'cantonese' }), rawLexemes[0], expect.anything())
    expect(adapter.defineMultipleFeature).toHaveBeenCalledWith(expect.objectContaining({ checkAttribute: 'pinyin' }), rawLexemes[0], expect.anything())

    expect(adapter.defineSimpleFeature).toHaveBeenCalledWith(expect.objectContaining({ checkAttribute: 'format' }), rawLexemes[0], expect.anything())
    expect(adapter.defineSimpleFeature).toHaveBeenCalledWith(expect.objectContaining({ checkAttribute: 'frequency' }), rawLexemes[0], expect.anything())
    expect(adapter.defineSimpleFeature).toHaveBeenCalledWith(expect.objectContaining({ checkAttribute: 'unicode' }), rawLexemes[0], expect.anything())
  })

  it('7 AlpheiosChineseLocAdapter - method defineMultipleFeature returns undefined if there is no such feature in rawLexeme', () => {
    // eslint-disable-next-line prefer-const
    let adapter = new AlpheiosChineseLocAdapter({
      category: 'morphology',
      adapterName: 'chineseloc',
      method: 'getHomonym'
    })

    const featureVal = adapter.defineMultipleFeature({ checkAttribute: 'fooAttr' }, { fooAttr1: 'test' }, [])

    expect(featureVal).toBeUndefined()
  })

  it('8 AlpheiosChineseLocAdapter - method defineMultipleFeature creates feature with passed value in rawLexemes and adds value if it is already existed', () => {
    // eslint-disable-next-line prefer-const
    let adapter = new AlpheiosChineseLocAdapter({
      category: 'morphology',
      adapterName: 'chineseloc',
      method: 'getHomonym'
    })

    let featureConfig = { checkAttribute: 'pinyin', featureType: Feature.types.pronunciation, featOrder: 4 }
    const featureVal1 = adapter.defineMultipleFeature(featureConfig, { pinyin: 'ér jin' }, [])

    expect(featureVal1.values).toEqual(['ér jin'])

    featureConfig = { checkAttribute: 'mandarin', featureType: Feature.types.pronunciation, featOrder: 3 }
    const featureVal2 = adapter.defineMultipleFeature(featureConfig, { mandarin: 'mandarin - ér  néng' }, [featureVal1])

    expect(featureVal1.values).toEqual(['ér jin', 'mandarin - ér  néng'])
  })

  it('9 AlpheiosChineseLocAdapter - method defineSimpleFeature returns undefined if there is no such feature in rawLexeme', () => {
    // eslint-disable-next-line prefer-const
    let adapter = new AlpheiosChineseLocAdapter({
      category: 'morphology',
      adapterName: 'chineseloc',
      method: 'getHomonym'
    })

    const featureVal = adapter.defineSimpleFeature({ checkAttribute: 'fooAttr' }, { fooAttr1: 'test' }, [])

    expect(featureVal).toBeUndefined()
  })

  it('10 AlpheiosChineseLocAdapter - method defineSimpleFeature creates feature with passed value in rawLexemes ', () => {
    // eslint-disable-next-line prefer-const
    let adapter = new AlpheiosChineseLocAdapter({
      category: 'morphology',
      adapterName: 'chineseloc',
      method: 'getHomonym'
    })

    const featureConfig = { checkAttribute: 'frequency', featureType: Feature.types.frequency }
    const featureVal1 = adapter.defineSimpleFeature(featureConfig, { frequency: 'least frequent' }, [])

    expect(featureVal1.value).toEqual('least frequent')
  })

  it('11 AlpheiosChineseLocAdapter - method extractShortDefinitions returns empty array if shortdefinitions are not defined', () => {
    // eslint-disable-next-line prefer-const
    let adapter = new AlpheiosChineseLocAdapter({
      category: 'morphology',
      adapterName: 'chineseloc',
      method: 'getHomonym'
    })

    const shortDefs = adapter.extractShortDefinitions({ dictEntry: '而今' })

    expect(shortDefs.length).toEqual(0)
  })

  it('12 AlpheiosChineseLocAdapter - method extractShortDefinitions returns array with short definition if it id defined', () => {
    // eslint-disable-next-line prefer-const
    let adapter = new AlpheiosChineseLocAdapter({
      category: 'morphology',
      adapterName: 'chineseloc',
      method: 'getHomonym'
    })

    const shortDefs = adapter.extractShortDefinitions({ dictEntry: '而今', shortDef: 'fooDef' })

    expect(shortDefs.length).toEqual(1)
    expect(shortDefs[0].text).toEqual('fooDef')
  })
})

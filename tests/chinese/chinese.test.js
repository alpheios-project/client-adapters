/* eslint-env jest */
/* eslint-disable no-unused-vars */
import 'whatwg-fetch'

/*
import SIMPIDX from './json/simp-idx.json'
import TRADIDX from './json/trad-idx.json'
import ADSODAT from './json/adsolines.json'
import HANZIDAT from './json/hanzi-dat.json'

import ChineseHelp from './chinese-help.js'
*/

import ClientAdapters from '@/client-adapters'
import AlpheiosChineseLocAdapter from '@/adapters/chineseloc/adapter.js'
import { Constants } from 'alpheios-data-models'

describe('chinese.test.js', () => {
  let dWordIndexSimp, dWordIndexTrad, dWordDict, dHanziDict

  function timeNow () {
    return ((this.getHours() < 10) ? '0' : '') + this.getHours() + ':' + ((this.getMinutes() < 10) ? '0' : '') + this.getMinutes() + ':' + ((this.getSeconds() < 10) ? '0' : '') + this.getSeconds()
  }

  let newDate

  beforeAll(async () => {
    /*
    dWordIndexSimp = ChineseHelp.convertIDX(SIMPIDX)
    dWordIndexTrad = ChineseHelp.convertIDX(TRADIDX)
    dWordDict = ChineseHelp.convertAdso2(ADSODAT)

    dHanziDict = ChineseHelp.convertHanzi(HANZIDAT)
    */
  })

  it.skip('Chinese test - lookup prototype', () => {
    // const targetWord = '一夫多妻主义者'

    const targetWord = '阿摩尼亚'
    // console.info('test dHanziDict - ', dHanziDict)
    // const result = ChineseHelp.lookupChinese(targetWord, dWordIndexSimp, dWordIndexTrad, dWordDict, dHanziDict)
    // console.info('final', result)

    const adapter = new AlpheiosChineseLocAdapter()

    // adapter.fetchChineseData = (targetWord) => ChineseHelp.lookupChinese(targetWord, dWordIndexSimp, dWordIndexTrad, dWordDict, dHanziDict)
    let result = adapter.getHomonym(targetWord)
    console.info('adapter', adapter.errors)
    console.info('result', result)
    
  })

  it('Chinese test - ClientAdapters prototype', async () => {
    const targetWord = '阿摩尼亚'

    let result = await ClientAdapters.morphology.chineseloc({
      method: 'getHomonym',
      clientId: 'testClientID',
      params: {
        languageID: Constants.LANG_CHINESE,
        word: targetWord
      }
    })
    console.info('result', result)
  })
})

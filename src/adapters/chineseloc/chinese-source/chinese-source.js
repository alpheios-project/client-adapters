/* eslint-disable no-unused-vars */
import SIMPIDX from './json/simp-idx.json'
import TRADIDX from './json/trad-idx.json'
import ADSODAT from './json/adsolines.json'
import HANZIDAT from './json/hanzi-dat.json'

let dWordIndexSimp, dWordIndexTrad, dWordDict, dHanziDict

export default class ChineseSource {
  static collectData () {
    if (!dWordIndexSimp) {
      dWordIndexSimp = ChineseSource.convertIDX(SIMPIDX)
      // console.info('lookupChinese collectData 1', dWordIndexSimp.size)
    }
    if (!dWordIndexTrad) {
      dWordIndexTrad = ChineseSource.convertIDX(TRADIDX)
      // console.info('lookupChinese collectData 2', dWordIndexTrad.size)
    }
    if (!dWordDict) {
      dWordDict = ChineseSource.convertAdso2(ADSODAT)
      // console.info('lookupChinese collectData 3', dWordDict.size)
    }
    if (!dHanziDict) {
      dHanziDict = ChineseSource.convertHanzi(HANZIDAT)
      // console.info('lookupChinese collectData 4', dHanziDict.size)
    }
  }

  static convertAdso2 (rawData) {
    let formattedData = new Map()
    let parsedLength = 0
    let currentIndex = 0

    //     let data = rawData.slice(0, 10)
    rawData.forEach(rawElement => {
      currentIndex = parsedLength
      parsedLength = parsedLength + rawElement.length + 2

      let parsedElement = rawElement
      let word = parsedElement.substr(0, parsedElement.indexOf('[')).trim()
      parsedElement = parsedElement.substr(parsedElement.indexOf('[') + 1)

      let pinyin = parsedElement.substr(0, parsedElement.indexOf(']'))
      parsedElement = parsedElement.substr(parsedElement.indexOf(']') + 1)

      let shortDef = parsedElement.trim().substr(1)
      shortDef = shortDef.substr(0, shortDef.length - 1).replace(/\//g, '; ')

      formattedData.set(currentIndex, {
        word, pinyin, shortDef
      })
    })

    return formattedData
  }

  static convertIDX (rawData) {
    let formattedData = new Map()

    // let data = rawData.slice(40, 50)
    rawData.forEach(rawElement => {
      let codes = []
      let checkEl = formattedData.get(rawElement[0])

      // console.info('checkEl - ', checkEl)

      if (checkEl) {
        // console.info('checkEl codes before - ', codes)
        codes.push(checkEl.codes[0])
        // console.info('checkEl codes after - ', codes)
      }

      codes.push(rawElement[1])
      formattedData.set(rawElement[0], {
        word: rawElement[0],
        codes: codes
      })
    })

    // console.info('formattedData - ', formattedData)
    return formattedData
  }

  static convertHanzi (rawData) {
    let formattedData = new Map()

    // let data = rawData.slice(0, 10)
    rawData.forEach(rawElement => {
      let character = rawElement[0]
      let typeCh = rawElement[1]
      let typeText = rawElement[2]

      let element = {
        character
      }
      element[typeCh] = typeText

      let prevElement = formattedData.get(rawElement[0])

      if (prevElement) {
        Object.keys(prevElement).filter(key => key !== 'character').forEach(key => {
          element[key] = prevElement[key]
        })
      }
      formattedData.set(character, element)
    })
    return formattedData
    // console.info('formattedData - ', formattedData)
  }

  static findWord (targetWord, wordIDX, wordDict) {
    let searchedIdxElement = wordIDX.get(targetWord)

    if (searchedIdxElement) {
      // console.info('serchedIdxElement.codes - ', searchedIdxElement.codes)
      if (searchedIdxElement.codes && searchedIdxElement.codes.length > 0) {
        // console.info('serchedIdxElement.codes - ', searchedIdxElement.codes)
        return searchedIdxElement.codes.map(code => {
          // console.info('findWord code - ', code, wordDict.get(code))
          return wordDict.get(code)
        })
      }
    }

    return null
  }

  static lookupChinese (targetWord) {
    // console.info('lookupChinese dHanziDict - ', dHanziDict.size)
    let cpWord = targetWord
    let count = 0
    let format = 'simp'

    let rs = []

    let result
    while (cpWord.length > 1) {
      // console.info('cpWord - ', cpWord)
      if (format === 'simp') {
        result = ChineseSource.findWord(cpWord, dWordIndexSimp, dWordDict)
        if (!result) {
          format = 'trad'
          result = ChineseSource.findWord(cpWord, dWordIndexTrad, dWordDict)
        }
      } else {
        result = ChineseSource.findWord(cpWord, dWordIndexTrad, dWordDict)
        if (!result) {
          format = 'simp'
          result = ChineseSource.findWord(cpWord, dWordIndexSimp, dWordDict)
        }
      }

      if (result) {
        result.forEach(resItem => {
          rs[count++] = resItem
          rs[count - 1].format = format

          ChineseSource.formatDictionaryEntry(rs[count - 1])
          ChineseSource.formatCharacterInfo(rs[count - 1], dHanziDict)
          rs[count - 1].pinyin = ChineseSource.formatPinyin(rs[count - 1].pinyin)
        })
      }
      cpWord = cpWord.substring(0, cpWord.length - 1)
    }

    return rs
  }

  static formatDictionaryEntry (resItem) {
    if (resItem.format === 'trad') {
      resItem.dictEntry = resItem.word.split(' ')[0]
    } else if (resItem.format === 'simp') {
      resItem.dictEntry = resItem.word.split(' ')[1]
    }
  }

  static formatCharacterInfo (resItem) {
    // console.info('formatCharacterInfo dHanziDict - ', dHanziDict)
    const freqName =
      [
        'least frequent',
        'less frequent',
        'moderately frequent',
        'more frequent',
        'most frequent'
      ]

    let unicode = ChineseSource.unicodeInfo(resItem.dictEntry)
    let hanziDatElement = dHanziDict.get(unicode)
    // console.info('hanziDatElement - ', hanziDatElement)

    if (hanziDatElement) {
      // console.info('hanziDatElement inside')

      if (hanziDatElement.kMandarin) {
        resItem.mandarin = ChineseSource.formatPinyin(hanziDatElement.kMandarin.toLowerCase)
      }
      if (hanziDatElement.kDefinition) {
        resItem.definition = hanziDatElement.kDefinition
      }
      if (hanziDatElement.kCantonese) {
        resItem.cantonese = hanziDatElement.kCantonese
      }
      if (hanziDatElement.kTang) {
        resItem.tang = hanziDatElement.kTang
      }
      if (hanziDatElement.kFrequency) {
        resItem.frequency = freqName[hanziDatElement.kFrequency - 1]
      }
      if (hanziDatElement.kRSUnicode) {
        resItem.unicode = hanziDatElement.kRSUnicode
      }
    }
  }

  static unicodeInfo (word) {
    const hex = '0123456789ABCDEF'
    const u = word.charCodeAt(0)
    return 'U+' +
        hex[(u >>> 12) & 15] +
        hex[(u >>> 8) & 15] +
        hex[(u >>> 4) & 15] +
        hex[u & 15]
  }

  static formatPinyin (aPinyin) {
    console.info('formatPinyin - ', aPinyin)
    // pinyin info
    const _a = ['\u0101', '\u00E1', '\u01CE', '\u00E0', 'a']
    const _e = ['\u0113', '\u00E9', '\u011B', '\u00E8', 'e']
    const _i = ['\u012B', '\u00ED', '\u01D0', '\u00EC', 'i']
    const _o = ['\u014D', '\u00F3', '\u01D2', '\u00F2', 'o']
    const _u = ['\u016B', '\u00FA', '\u01D4', '\u00F9', 'u']
    const _v = ['\u01D6', '\u01D8', '\u01DA', '\u01DC', '\u00FC']

    aPinyin = aPinyin.split(/(\d)/)

    let formatedPinyin = []

    let toneFormat = {
      1: 0, 2: 1, 3: 2, 4: 3
    }

    for (var j = 0; j < aPinyin.length; j++) {
      if (j % 2 === 0) {
        let pin = aPinyin[j]
        let tone = toneFormat[aPinyin[j + 1]] ? toneFormat[aPinyin[j + 1]] : 4

        if (pin.indexOf('a') !== -1) {
          pin = pin.replace('a', _a[tone])
        } else if (pin.indexOf('e') !== -1) {
          pin = pin.replace('e', _e[tone])
        } else if (pin.indexOf('ou') !== -1) {
          pin = pin.replace('o', _o[tone])
        } else {
          for (var k = pin.length - 1; k >= 0; k--) {
            if (ChineseSource.isVowel(pin[k])) {
              switch (pin[k]) {
                case 'i':
                  pin = pin.replace('i', _i[tone])
                  break
                case 'o':
                  pin = pin.replace('o', _o[tone])
                  break
                case 'u':
                  if (k + 1 < pin.length - 1 && pin[k + 1] === ':') { pin = pin.replace('u:', _v[tone]) } else { pin = pin.replace('u', _u[tone]) }
                  break
                default:
                  console.info('some kind of weird vowel')
              }
              break
            }
          }
        }

        formatedPinyin.push(pin)
      }
    }

    return formatedPinyin.join(' ')
  }

  static isVowel (aLetter) {
    return (aLetter === 'a' ||
            aLetter === 'e' ||
            aLetter === 'i' ||
            aLetter === 'o' ||
            aLetter === 'u'
    )
  }
}

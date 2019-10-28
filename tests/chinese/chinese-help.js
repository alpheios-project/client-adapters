import 'whatwg-fetch'

export default class ChineseHelp {
  static convertAdso (rawData) {
    let formattedData = new Map()

    rawData.forEach(rawElement => {
      let word = ''
      let pinyin
      let value = ''
      let hasWord = false

      rawElement.forEach(rawPart => {
        if (!hasWord && rawPart.substr(0, 1) !== '[') {
          word = word + ' ' + rawPart
        } else if (!hasWord && rawPart.substr(0, 1) === '[') {
          hasWord = true
          pinyin = rawPart
        } else if (rawPart.length > 0) {
          value = value + ' ' + rawPart
        }
      })
      value = value.trim().replace('/', '').replace('/', '')
      word = word.trim()
      let finalElement = { word, pinyin, value }

      formattedData.set(word, finalElement)
    })
    return formattedData
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

  static lookupChinese (targetWord, dWordIndexSimp, dWordIndexTrad, dWordDict, dHanziDict) {
    // console.info('lookupChinese dHanziDict - ', dHanziDict)
    let cpWord = targetWord
    let count = 0
    let format = 'simp'

    let rs = []

    let result
    while (cpWord.length > 1) {
      // console.info('cpWord - ', cpWord)
      if (format === 'simp') {
        result = ChineseHelp.findWord(cpWord, dWordIndexSimp, dWordDict)
        if (!result) {
          format = 'trad'
          result = ChineseHelp.findWord(cpWord, dWordIndexTrad, dWordDict)
        }
      } else {
        result = ChineseHelp.findWord(cpWord, dWordIndexTrad, dWordDict)
        if (!result) {
          format = 'simp'
          result = ChineseHelp.findWord(cpWord, dWordIndexSimp, dWordDict)
        }
      }

      if (result) {
        result.forEach(resItem => {
          rs[count++] = resItem
          rs[count - 1].format = format

          ChineseHelp.formatDictionaryEntry(rs[count - 1])
          ChineseHelp.formatCharacterInfo(rs[count - 1], dHanziDict)
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

  static formatCharacterInfo (resItem, dHanziDict) {
    // console.info('formatCharacterInfo dHanziDict - ', dHanziDict)
    const freqName =
      [
        'least frequent',
        'less frequent',
        'moderately frequent',
        'more frequent',
        'most frequent'
      ]

    let unicode = ChineseHelp.unicodeInfo(resItem.dictEntry)
    let hanziDatElement = dHanziDict.get(unicode)
    // console.info('hanziDatElement - ', hanziDatElement)

    if (hanziDatElement) {
      // console.info('hanziDatElement inside')

      if (hanziDatElement.kMandarin) {
        resItem.mandarin = hanziDatElement.kMandarin
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
}

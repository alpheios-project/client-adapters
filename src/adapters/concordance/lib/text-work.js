class TextWork {
  constructor (author, urn, titles) {
    this.urn = urn
    this.titles = titles
    this.author = author
    this.ID = this.extractIDFromURN()
  }

  static get defaultLang () {
    return 'eng'
  }

  static get defaultIDPrefix () {
    return 'phi'
  }

  get title () {
    if (this.titles[TextWork.defaultLang]) {
      return this.titles[TextWork.defaultLang]
    }

    return Object.values(this.titles)[0]
  }

  static create (author, jsonObj) {
    let titles = {}
    jsonObj.title.forEach(titleItem => {
      titles[titleItem['@lang']] = titleItem['@value']
    })

    return new TextWork(author, jsonObj.urn, titles)
  }

  extractIDFromURN () {
    let partsUrn = this.urn.split(':')
    let workIDPart = partsUrn[3].indexOf('.') === -1 ? partsUrn[3] : partsUrn[3].substr(partsUrn[3].indexOf('.') + 1)
    return parseInt(workIDPart.replace(TextWork.defaultIDPrefix, ''))
  }
}

export default TextWork

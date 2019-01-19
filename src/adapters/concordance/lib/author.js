import TextWork from '@/adapters/concordance/lib/text-work'

class Author {
  constructor (urn, titles) {
    this.urn = urn
    this.titles = titles
    this.ID = this.extractIDFromURN()
  }

  static get defaultLang () {
    return 'eng'
  }

  static get defaultIDPrefix () {
    return 'phi'
  }

  get title () {
    if (this.titles[Author.defaultLang]) {
      return this.titles[Author.defaultLang]
    }

    return Object.values(this.titles)[0]
  }

  static create (jsonObj) {
    let titles = {}
    jsonObj.title.forEach(titleItem => {
      titles[titleItem['@lang']] = titleItem['@value']
    })

    let author = new Author(jsonObj.urn, titles)
    let works = []

    jsonObj.works.forEach(workItem => {
      works.push(TextWork.create(author, workItem))
    })

    author.works = works
    return author
  }

  extractIDFromURN () {
    let partsUrn = this.urn.split(':')
    let workIDPart = partsUrn[3].indexOf('.') === -1 ? partsUrn[3] : partsUrn[3].substr(0, partsUrn[3].indexOf('.'))
    return parseInt(workIDPart.replace(Author.defaultIDPrefix, ''))
  }
}

export default Author

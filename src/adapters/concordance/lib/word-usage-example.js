import { TextQuoteSelector } from 'alpheios-data-models'

export default class WordUsageExample extends TextQuoteSelector {
  createContext () {
    return null // not implemented in the current child-class
  }
  static readObject (jsonObj, homonym, author, textWord, sourceLink) {
    let wordUsageExample = new WordUsageExample(homonym.language, jsonObj.target)
    wordUsageExample.prefix = jsonObj.left
    wordUsageExample.suffix = jsonObj.right
    wordUsageExample.source = sourceLink + jsonObj.link
    wordUsageExample.cit = jsonObj.cit
    wordUsageExample.author = author
    wordUsageExample.textWord = textWord

    // console.info('********************jsonObj', jsonObj)
    return wordUsageExample
  }

  get htmlExample () {
    return `${this.prefix}<span class="">${this.normalizedText}</span>${this.suffix}`
  }
}

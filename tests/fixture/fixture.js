import parser from 'fast-xml-parser'

import LatTuftsPalmaque from '@tests/fixture/localJson/lat-tufts-palmaque.xml'
import LatTuftsMare from '@tests/fixture/localJson/lat-tufts-mare.xml'
import LatTuftsCepit from '@tests/fixture/localJson/lat-tufts-cepit.xml'
import LatTuftsDefault from '@tests/fixture/localJson/lat-tufts-default.xml'
import LatTuftsSubmersasque from '@tests/fixture/localJson/lat-tufts-submersasque.xml'


const library = {
  lat: {
    tufts: {
      default: LatTuftsDefault,
      'palmaque': LatTuftsPalmaque,
      'mare': LatTuftsMare,
      'cepit': LatTuftsCepit,
      'submersasque': LatTuftsSubmersasque
    }
  }
}

export default class Fixture {
  static defineFileByParameters (params) {
    if (!library[params.langCode]) { return }
    if (!library[params.langCode][params.adapter]) { return }
    
    return library[params.langCode][params.adapter][params.word] ? library[params.langCode][params.adapter][params.word] : library[params.langCode][params.adapter].default
  }

  static getFixtureRes(params) {
    const sourceData = Fixture.defineFileByParameters(params)

    if (!sourceData) { 
      console.info('There is no fixture for ', params.langCode + '-' + params.adapter + '-' + params.word)
      return
    }
    const options = {
      ignoreNameSpace : true,
      ignoreAttributes : false,
      attributeNamePrefix : "",
      textNodeName : "$"
    }
    
    const resJson = parser.parse(sourceData, options)

    if (!resJson.RDF.Annotation.Body) {
      return resJson
    }

    if (!Array.isArray(resJson.RDF.Annotation.Body)) {
      resJson.RDF.Annotation.Body = [resJson.RDF.Annotation.Body]
    }
    resJson.RDF.Annotation.Body.forEach(bodyItem => {
      if (bodyItem.rest.entry && bodyItem.rest.entry.infl.term && bodyItem.rest.entry.infl.term.stem) {
        bodyItem.rest.entry.infl.term.stem = { '$': bodyItem.rest.entry.infl.term.stem }
      }
      if (bodyItem.rest.entry && bodyItem.rest.entry.infl.term && bodyItem.rest.entry.infl.term.suff) {
        bodyItem.rest.entry.infl.term.suff = { '$': bodyItem.rest.entry.infl.term.suff }
      }
      if (bodyItem.rest.entry && bodyItem.rest.entry.infl.term && bodyItem.rest.entry.infl.term.pref) {
        bodyItem.rest.entry.infl.term.pref = { '$': bodyItem.rest.entry.infl.term.pref }
      }
    
      if (bodyItem.rest.entry && bodyItem.rest.entry.xmpl) {
        bodyItem.rest.entry.xmpl = { '$': bodyItem.rest.entry.xmpl }
      }
    })
    return resJson
  }
}


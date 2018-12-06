import Whitakers from '@/adapters/tufts/engine/whitakers'
import Morpheusgrc from '@/adapters/tufts/engine/morpheusgrc'
import Aramorph from '@/adapters/tufts/engine/aramorph'
import Hazm from '@/adapters/tufts/engine/hazm'
import Traces from '@/adapters/tufts/engine/traces'

import { LanguageModelFactory as LMF } from 'alpheios-data-models'

class EnginesSet {
  /*
   * @param {adapterConfigEngines} Object - it is the following format - Symbol(Latin): ["whitakerLat"]
  */
  constructor (adapterConfigEngines) {
    this.engine = adapterConfigEngines
  }

  /*
   * This method returns engine class by languageID
   * @param {languageID} Symbol
  */
  getEngineByCode (languageID) {
    if (this.engine[languageID]) {
      let engineCode = this.engine[languageID][0]
      let allEngines = new Map(([ Whitakers, Morpheusgrc, Aramorph, Hazm, Traces ]).map((e) => { return [ e.engine, e ] }))
      return allEngines.get(engineCode)
    }
  }

  /*
   * This method returns engine class by languageCode
   * @param {languageCode} String
  */
  getEngineByCodeFromLangCode (languageCode) {
    let languageID = LMF.getLanguageIdFromCode(languageCode)
    return this.getEngineByCode(languageID)
  }
}

export default EnginesSet

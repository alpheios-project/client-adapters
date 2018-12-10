# Alpheios Client Adapters Library

## Configuration files

**adapters-config.json**

* category 
    * adapterName 
        * adapterFunc
        * methods
        * params
           
| Name | Type | Description |
|------|------|-------------|
| **category** | String | This is a group of adapters by aim: morphology, lexicon, lemmatranslation |
| **adapterName** | String | This is a adapter inside category group |
| **adapterFunc** | String | This is a method name for current adapter inside ClientAdapters |
| **methods** | [String] | This is an array with available methods for current adapter. If a given method is not registered here, than it would be ignored |
| **params** | [String : [String]] | This is an array of parameters for the given method, if parameter is not regestered here - it won't be checked |

**Example:**
```
"morphology": {
    "tufts": {
      "adapter": "maAdapter",
      "methods": [ "getHomonym" ],
      "params": {
        "getHomonym" : [ "languageID", "word" ]
      }
    }
}
```
## Morphology.tufts Adapter

**Format of execution**

```
let result = ClientAdapters.maAdapter({
  method: 'getHomonym',
  params: {
    languageID: Constants.LANG_LATIN,
    word: 'placito'
  }
})
```

**Parameters**

| Name | Type | Description |
|------|------|-------------|
| languageID | Symbol | Language ID for the input word |
| word | String | Input word |


**Result: Promise**

| Name | Type | Description |
|------|------|-------------|
| homonym | Homonym | The result of morphology analyzer |
| errors | Array | Array of AdapterError objects |


**Avalable languages:**

| Language | Engine [config.js](https://github.com/alpheios-project/client-adapters/blob/master/src/adapters/tufts/config.json) | Engine Js |
|------|------|-------------|
| Constants.LANG_LATIN | whitakerLat | [whitakers.js](https://github.com/alpheios-project/client-adapters/blob/master/src/adapters/tufts/engine/whitakers.js) |
| Constants.LANG_GREEK | morpheusgrc | [morpheusgrc.js](https://github.com/alpheios-project/client-adapters/blob/master/src/adapters/tufts/engine/morpheusgrc.js) |
| Constants.LANG_ARABIC | aramorph | [aramorph.js](https://github.com/alpheios-project/client-adapters/blob/master/src/adapters/tufts/engine/aramorph.js) |
| Constants.LANG_PERSIAN | hazm | [hazm.js](https://github.com/alpheios-project/client-adapters/blob/master/src/adapters/tufts/engine/hazm.js) |
| Constants.LANG_GEEZ | traces | [traces.js](https://github.com/alpheios-project/client-adapters/blob/master/src/adapters/tufts/engine/traces.js) |

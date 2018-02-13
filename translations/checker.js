// this is a script to help spot missing translations!

const merge = require('lodash/mergeWith')
const flat = require('flat')

const en = flat(require('./en'))
const zh = flat(require('./zh'))

function customizer (objVal, srcVal, key, obj, src, stack) {
  // See docs https://lodash.com/docs/4.17.4#mergeWith

  if (objVal == undefined) { // implies zh is missing key
    if (typeof srcVal === 'string') console.log(key, '=', srcVal)
  }
}

merge(zh, en, customizer)
// signature: obj, src, customizer
// order matters because of customizer

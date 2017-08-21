const nest = require('depnest')
const merge = require('lodash/merge')

exports.gives = nest('translations.sync.strings')

const en = require('./en.js')
const ch = require('./ch_ma.js')

exports.create = (api) => {
  // return nest('translations.sync.strings', () => en)
  return nest('translations.sync.strings', () => {
    const chWithFallback = merge({}, en, ch)
    return chWithFallback
  })
}



const nest = require('depnest')
const merge = require('lodash/merge')

exports.gives = nest('translations.sync.strings')

const en = require('./en.js')
const zh = require('./zh.js')

exports.create = (api) => {
  // return nest('translations.sync.strings', () => en)
 
  return nest('translations.sync.strings', () => {
    return merge({}, en, zh)
  })
}



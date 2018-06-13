const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')

// polyfills
require('setimmediate')

// add inspect right click menu
require('../context-menu')

// from more specialized to more general
const sockets = combine(
  // need some modules first
  {
    settings: require('patch-settings'),
    translations: require('../translations/sync'),
    styles: require('../styles')
  },
  {
    app: require('./app')
  }
)

const api = entry(sockets, nest({
  'ftu.app': 'first'
}))

document.body.appendChild(api.ftu.app())

const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')

// polyfills
require('setimmediate')

// add inspect right click menu
require('./context-menu')

// from more specialized to more general
const sockets = combine(
  {
    app: require('./app'),
    blob: require('./blob'),
    config: require('./config'),
    router: require('./router'),
    styles: require('./styles')
  },
  require('patch-history'),
  require('patchcore')
)

const api = entry(sockets, nest('app.html.app', 'first'))

const app = api.app.html.app()

// TODO (mix) : once app has swapping pages, attach the app to the page here
// document.body.appendChild(app)

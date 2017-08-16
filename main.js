const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')

// polyfills
require('setimmediate')

// add inspect right click menu
require('./context-menu')

// from more specialized to more general
const sockets = combine(
  //we always need to have translations first!
  {translations: require('./translations/sync')},
  {
    about: require('./about'),
    app: require('./app'),
    blob: require('./blob'),
    //config: require('./ssb-config'),
    config: require('./config'),
    message: require('./message'),
    router: require('./router'),
    styles: require('./styles'),
    state: require('./state/obs'),
  },
//  require('patch-history'),
  require('patchcore')
)

const api = entry(sockets, nest('app.html.app', 'first'))

const app = api.app.html.app()

// TODO (mix) : once app has swapping pages, attach the app to the page here
// document.body.appendChild(app)






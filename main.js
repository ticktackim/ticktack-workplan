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

const api = entry(sockets, nest({
    'app.html.app': 'first',
    'invite.async.autofollow': 'first'
}))

document.body.appendChild(api.app.html.app())

api.invite.async.autofollow(
  'wx.larpa.net:8008:@DTNmX+4SjsgZ7xyDh5xxmNtFqa6pWi5Qtw7cE8aR9TQ=.ed25519~YIRnryeLBhtBa2il9fCWDlAIFWR37Uh63Vep0L6tk6c=',
  function (err, follows) {
  console.log('autofollowed', err, follows);
})








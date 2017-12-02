const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')

// polyfills
require('setimmediate')

// add inspect right click menu
require('./context-menu')

// from more specialized to more general
const sockets = combine(
  //need some modules first
  { 
    settings: require('patch-settings'),
    translations: require('./translations/sync'),
    suggestions: require('patch-suggest'), // so that styles can be over-ridden
  },
  {
    about: require('./about'),
    app: require('./app'),
    blob: require('./blob'),
    contact: require('./contact'),
    //config: require('./ssb-config'),
    config: require('./config'),
    // group: require('./group'),
    message: require('./message'),
    router: require('./router'),
    styles: require('./styles'),
    state: require('./state/obs'),
    unread: require('./unread'),
  },
  {
    profile: require('patch-profile'),
    history: require('patch-history'),
    core: require('patchcore')
  }
)

const api = entry(sockets, nest({
  'app.html.app': 'first',
  'invite.async.autofollow': 'first',
  'config.sync.load': 'first'
}))

document.body.appendChild(api.app.html.app())

var invite = api.config.sync.load().autoinvite
if(invite)
  api.invite.async.autofollow(
   invite,
    function (err, follows) {
    console.log('autofollowed', err, follows);
  })
else
  console.log('no invite')

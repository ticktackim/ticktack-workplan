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
  'config.sync.load': 'first',
  'sbot.async.friendsGet': 'first',
  'sbot.async.get': 'first'
}))

document.body.appendChild(api.app.html.app())
console.log(api.config.sync.load())

var invite = api.config.sync.load().autoinvite
var self_id = api.config.sync.load().keys.id
if(invite) {
  api.sbot.async.friendsGet({dest: self_id}, function (err, friends) {
    var c = 0
    //if you have less than 5 followers, maybe use the autoinvite
    if(Object.keys(friends).length <= 5)
      api.invite.async.autofollow(
       invite,
        function (err, follows) {
        console.log('autofollowed', err, follows);
      })
    else
      console.log('already onboarded')
  })
}
else
  console.log('no invite')



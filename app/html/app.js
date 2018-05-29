const nest = require('depnest')
const { h, Value, onceTrue } = require('mutant')

exports.gives = nest('app.html.app')

exports.needs = nest({
  'app.sync.initialize': 'map',
  'app.html.header': 'first',
  'app.html.warning': 'first',
  'history.obs.location': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'router.sync.router': 'first',
  'settings.sync.get': 'first',
  'settings.sync.set': 'first',
  'invite.async.autofollow': 'first',
  'config.sync.load': 'first',
  'sbot.async.friendsGet': 'first',
  'sbot.async.get': 'first',
})

exports.create = (api) => {
  var view

  return nest({
    'app.html.app': function app () {
      api.app.sync.initialize()

      view = Value()
      var app = h('App', view)
      api.history.obs.location()(renderLocation)
      api.history.obs.location()(loc => console.log('location:', loc))

      startApp()

      return app
    }
  })

  function renderLocation (loc) {
    var page = api.router.sync.router(loc)
    if (page) {
      view.set([
        api.app.html.header({location: loc, push: api.history.sync.push}),
        api.app.html.warning(),
        page
      ])
    }
  }

  function startApp () {
    api.history.sync.push({page: 'splash'})

    const delay = process.env.STARTUP_DELAY || 3500
    setTimeout(enterApp, delay)
  }

  function enterApp () {
    const isOnboarded = api.settings.sync.get('onboarded')
    const initialPage = process.env.STARTUP_PAGE || 'blogIndex'
    if (isOnboarded) {
      autoPub()
      api.history.sync.push({page: initialPage})
    } else {
      api.history.sync.push({
        page: 'userEdit',
        feed: api.keys.sync.id(),
        callback: (err, didEdit) => {
          if (err) throw new Error('Error editing profile', err)

          // if they clicked something, just mark them onboarded
          api.settings.sync.set({ onboarded: true })

          autoPub()
          api.history.sync.push({page: initialPage})
        }
      })
    }
  }

  function autoPub () {
    var invites = api.config.sync.load().autoinvites
    if (!invites) {
      console.log('no invites')
      return
    }

    useInvites(invites)
    // TODO change it so that if you already have a bunch of friends you unfollow the pubs after they follow you?

    // var myKey = api.config.sync.load().keys.id
    // api.sbot.async.friendsGet({dest: myKey}, function (err, friends) {
    //   // if you have less than 5 followers, maybe use the autoinvite
    //   if (Object.keys(friends).length <= 5) useInvites(invites)
    //   else console.log('no autoinvite - you have friends already')
    // })

    function useInvites (invites) {
      invites.forEach(invite => {
        console.log('using invite:', invite)
        api.invite.async.autofollow(invite, (err, follows) => {
          if (err) console.error('Autofollow error:', err)
          else console.log('Autofollow success', follows)
        })
      })
    }
  }
}

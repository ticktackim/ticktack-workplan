const nest = require('depnest')
const { h, Value } = require('mutant')

exports.gives = nest('app.html.app')

exports.needs = nest({
  'app.sync.initialize': 'map',
  'app.html.header': 'first',
  'history.obs.location': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'router.sync.router': 'first',
  'settings.sync.get': 'first',
  'settings.sync.set': 'first',
})

exports.create = (api) => {
  return nest({
    'app.html.app': function app () {
      api.app.sync.initialize()

      var view = Value()
      var app = h('App', view)
      api.history.obs.location()(renderLocation)
      function renderLocation (loc) {
        var page = api.router.sync.router(loc)
        if (page) view.set([
          api.app.html.header({location: loc, push: api.history.sync.push}),
          page
        ])
      }

      startApp()

      return app
    }
  })

  function startApp () {
    api.history.sync.push({page: 'splash'})

    setTimeout(enterApp, 2000)
  }

  function enterApp() {
    const isOnboarded = api.settings.sync.get('onboarded')
    if (isOnboarded)
      api.history.sync.push({page: 'blogIndex'})
    else {
      api.history.sync.push({
        page:'userEdit',
        feed: api.keys.sync.id(),
        callback: (err, didEdit) => {
          if (err) throw new Error ('Error editing profile', err)

          // if they clicked something, just mark them onboarded
          api.settings.sync.set({ onboarded: true })

          api.history.sync.push({ page: 'blogIndex' })
        }
      })
    }

  }
}


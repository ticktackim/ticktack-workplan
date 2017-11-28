const nest = require('depnest')
const { h, Value } = require('mutant')

exports.gives = nest('app.html.app')

exports.needs = nest({
  'app.sync.initialize': 'map',
  'app.html.header': 'first',
  'history.obs.location': 'first',
  'history.sync.push': 'first',
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
        console.log('rendering new view', loc)
        var page = api.router.sync.router(loc)
        if (page) view.set([
          api.app.html.header({location: loc, push: api.history.sync.push}),
          page
        ])
      }

      const isOnboarded = api.settings.sync.get('onboarded')
      if (isOnboarded)
        api.history.sync.push({page: 'home'})
      else {
        api.history.sync.push({
          page:'userEdit',
          feed: api.keys.sync.id(),
          callback: (err, didEdit) => {
            if (err) throw new Error ('Error editing profile', err)

            if (didEdit)
              api.settings.sync.set({ onboarded: true })

            api.history.sync.push({ page: 'home' })
          }
        }) 
      }


      return app
    }
  })
}


const nest = require('depnest')
const HyperNav = require('hyper-nav')
const { h } = require('mutant')

exports.gives = nest({
  'app.sync.nav': true,
  'history.obs.history': true,
  'history.sync.push': true,
  'history.sync.back': true,
})

exports.needs = nest({
  'app.html.header': 'first',
  'keys.sync.id': 'first',
  'router.sync.router': 'first',
  'settings.sync.get': 'first',
  'settings.sync.set': 'first',
})

exports.create = (api) => {
  var nav = null

  return nest({
    'app.sync.nav': function getNav () {
      if (nav) return nav

      nav = HyperNav(
        api.router.sync.router,
        api.app.html.header
      )

      const isOnboarded = api.settings.sync.get('onboarded')
      if (isOnboarded)
        nav.push({page: 'home'})
      else {
        nav.push({
          page:'userEdit',
          feed: api.keys.sync.id(),
          callback: (err, didEdit) => {
            if (err) throw new Error ('Error editing profile', err)

            if (didEdit)
              api.settings.sync.set({ onboarded: true })

            nav.push({ page: 'home' })
          }
        }) 
      }

      return nav
    },
    'history.sync.push': (location) => nav.push(location),
    'history.sync.back': () => nav.back(),
    'history.obs.history': () => nav.history,
  })
}


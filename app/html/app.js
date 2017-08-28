const nest = require('depnest')
const values = require('lodash/values')
const insertCss = require('insert-css')
const openExternal = require('open-external')

const HyperNav = require('hyper-nav')
const computed = require('mutant/computed')
const h = require('mutant/h')

exports.gives = nest({
  'app.html.app': true,
  'history.obs.history': true,
  'history.sync.push': true,
  'history.sync.back': true,
})

exports.needs = nest({
  'about.async.suggest': 'first',
  'app.html.header': 'first',
  'app.async.catchLinkClick': 'first',
  'channel.async.suggest': 'first',
  'keys.sync.id': 'first',
  'router.sync.router': 'first',
  'settings.sync.get': 'first',
  'settings.sync.set': 'first',
  'styles.css': 'reduce',
})

exports.create = (api) => {
  var nav = null

  return nest({
    'app.html.app': function app () {

      // DIRTY HACK - initializes the suggestion indexes
      api.about.async.suggest()
      api.channel.async.suggest()

      const css = values(api.styles.css()).join('\n')
      insertCss(css)

      api.app.async.catchLinkClick(document.body, (link, { isExternal }) => {
        if (isExternal) return openExternal(link)
        nav.push(link)
      })

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




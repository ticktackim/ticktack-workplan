const nest = require('depnest')
const values = require('lodash/values')
const insertCss = require('insert-css')
const openExternal = require('open-external')

const HyperNav = require('hyper-nav')
const computed = require('mutant/computed')
const h = require('mutant/h')

exports.gives = nest({
  'app.html.app': true,
  'history.obs.location': true,
  'history.sync.push': true,
  'history.sync.back': true,
})

exports.needs = nest({
  'app.html.header': 'first',
  'app.async.catchLinkClick': 'first',
  'router.sync.router': 'first',
  'styles.css': 'reduce'
})

exports.create = (api) => {
  var nav = null

  return nest({
    'app.html.app': function app () {
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

      nav.push({page: 'home'})
      return nav
    },
    'history.sync.push': (location) => nav.push(location),
    'history.sync.back': () => nav.back(),
    'history.obs.location': () => nav.history,
  })
}




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
  'app.async.catchLinkClick': 'first',
  'router.sync.router': 'first',
  'styles.css': 'first'
})

exports.create = (api) => {

  var nav = HyperNav(api.router.sync.router, function (nav) {
    return h('Header', [
      h('nav', [
        h('div.back', { 'ev-click': nav.back }, '←'),
        h('div', { 'ev-click': () => nav.push({page:'home'}) }, 'Home')
      ]),
      h('h1', computed(nav.location, e => e.element.title)),
    ])
  })

  return nest({
    'app.html.app': function app () {
      const css = values(api.styles.css()).join('\n')
      insertCss(css)

      api.app.async.catchLinkClick(document.body, (link, { isExternal }) => {
        if (isExternal) return openExternal(link)
        nav.push(link)
      })
      nav.push({page: 'home'})
      return nav
    },
    'history.sync.push': (location) => nav.push(location),
    'history.sync.back': () => nav.back(),
    'history.obs.location': () => nav.history,
  })
}




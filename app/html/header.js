const nest = require('depnest')
const { h, computed, when } = require('mutant')
const get = require('lodash/get')

exports.gives = nest('app.html.header')

exports.needs = nest('keys.sync.id', 'first')

const FEED_PAGES = [
  'home',
  'blogIndex',
  'blogNew',
  'threadShow', // TODO - this doesn't work (`threadSHow` isn't part of the location atm)
  'threadNew',
  // 'blogSearch',
]
const SETTINGS_PAGES = [
  'settings',
  'userEdit',
]

exports.create = (api) => {
  return nest('app.html.header', (nav) => {
    const { location, push } = nav

    const loc = computed(location, location => {
      if (typeof location != 'object') return {}

      return location.location || {}
    })
    // Dominics nav location api is slightly different than mine - it nest location in nav.location.location

    const isFeed = computed(loc, loc => {
      return FEED_PAGES.includes(loc.page) || (loc.key && loc.feed)
    })

    const isSettings = computed(loc, loc => {
      return SETTINGS_PAGES.includes(loc.page)
    })

    return h('Header', [
      h('nav', [
        h('i.fa', {
          'ev-click': () => push({page: 'blogIndex'}),
          className: when(isFeed, 'fa-commenting', 'fa-commenting-o')
        }),
        h('i.fa', {
          className: when(isSettings, 'fa-user', 'fa-user-o'),
          'ev-click': () => push({page: 'settings'})
        })
      ]),
    ])
  })
}

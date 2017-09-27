const nest = require('depnest')
const { h, computed } = require('mutant')
const get = require('lodash/get')

exports.gives = nest('app.html.header')

exports.needs = nest('keys.sync.id', 'first')

const FEED_PAGES = [
  'home',
  'blogIndex',
  'threadShow', // TODO - this doesn't work (`threadSHow` isn't part of the location atm)
  // 'blogSearch',
  // 'threadShow',
  // 'threadNew',
]
const SETTINGS_PAGES = [
  'settings',
  'userEdit',
]

exports.create = (api) => {
  return nest('app.html.header', (nav) => {
    const { location, push } = nav
    const currentPage = computed(location, loc => get(loc, 'location.page'))

    return h('Header', [
      h('nav', [
        h('i.fa', { 
          'ev-click': () => push({page: 'blogIndex'}),
          className: computed(currentPage, page => FEED_PAGES.includes(page) ? 'fa-commenting' : 'fa-commenting-o')
        }),
        h('i.fa', {
          className: computed(currentPage, page => SETTINGS_PAGES.includes(page) ? 'fa-user' : 'fa-user-o'),
          'ev-click': () => push({page: 'settings'})
        })
      ]),
    ])
  })
}

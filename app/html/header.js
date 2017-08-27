const nest = require('depnest')
const { h, computed } = require('mutant')

exports.gives = nest('app.html.header')

exports.needs = nest('keys.sync.id', 'first')

exports.create = (api) => {
  return nest('app.html.header', (nav) => {
    return h('Header', [
      h('nav', [
        h('div.back', { 'ev-click': nav.back }, [
          h('i.fa.fa-angle-left')
        ]),
        h('i.fa.fa-home', { 'ev-click': () => nav.push({page:'home'}) }),
        // FUTURE breadcrumb here ?
        // h('h1', computed(nav.location, e => e.element.title)),

        h('div.tools', [
          // h('i.fa.fa-user', { 'ev-click': () => nav.push({page:'userEdit', feed: api.keys.sync.id()}) }), // TEMP
          h('i.fa.fa-address-book', { 'ev-click': () => nav.push({page:'userFind'}) }),
          h('i.fa.fa-hashtag', { 'ev-click': () => nav.push({page:'groupFind'}) }),
          h('i.fa.fa-gear', { 'ev-click': () => nav.push({page:'settings'}) })
        ])
      ]),
    ])
  })
}

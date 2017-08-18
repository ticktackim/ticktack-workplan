const nest = require('depnest')
const { h, computed } = require('mutant')

exports.gives = nest('app.html.header')

exports.create = (api) => {
  return nest('app.html.header', (nav) => {
    return h('Header', [
      h('nav', [
        h('div.back', { 'ev-click': nav.back }, [
          h('i.fa.fa-angle-left')
        ]),
        h('i.fa.fa-home', { 'ev-click': () => nav.push({page:'home'}) }),
        // breadcrumb here potentially
        // h('h1', computed(nav.location, e => e.element.title)),

        h('div.tools', [
          h('i.fa.fa-address-book', { 'ev-click': () => nav.push({page:'userFind'}) }),
          h('i.fa.fa-hashtag', { 'ev-click': () => nav.push({page:'groupFind'}) })
        ])
      ]),
    ])
  })
}


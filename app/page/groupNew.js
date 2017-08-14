const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.groupNew')

exports.needs = nest({
  'app.html.nav': 'first'
})

exports.create = (api) => {
  return nest('app.page.groupNew', groupNew)

  function groupNew (location) {
    return h('Page -groupNew', [
      h('h1', 'Group New'),
      api.app.html.nav()
    ])
  }
}

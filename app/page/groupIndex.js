const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.groupIndex')

exports.needs = nest({
  'app.html.nav': 'first'
})

exports.create = (api) => {
  return nest('app.page.groupIndex', groupIndex)

  function groupIndex (location) {
    return h('Page -groupIndex', [
      h('h1', 'Group Index'),
      api.app.html.nav()
    ])
  }
}

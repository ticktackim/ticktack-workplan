const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.groupFind')

exports.needs = nest({
  'app.html.nav': 'first'
})

exports.create = (api) => {
  return nest('app.page.groupFind', groupFind)

  function groupFind (location) {

    return h('Page -groupFind', [
      h('h1', 'Group Find'),
      api.app.html.nav(),
      h('p', `key: ${location.key}`)
    ])
  }
}

const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.groupShow')

exports.needs = nest({
  'app.html.nav': 'first'
})

exports.create = (api) => {
  return nest('app.page.groupShow', groupShow)

  function groupShow (location) {
    // location here can be the root message of a group : { type: 'group', key }
    // TODO show specific group index described by key

    return h('Page -groupShow', [
      h('h1', 'Group Show'),
      api.app.html.nav(),
      h('p', `key: ${location.key}`)
    ])
  }
}

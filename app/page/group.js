const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.group')

exports.needs = nest({
  'app.sync.goTo': 'first'
})

exports.create = (api) => {
  return nest('app.page.group', group)

  function group (location) {
    // location here can be the root message of a group : { type: 'group', key }
    // TODO show specific group index described by key

    const { goTo } = api.app.sync

    return h('Page -group', [
      h('h1', 'Group'),
      h('a', { 'ev-click': () => goTo({ page: 'home' }) }, 'Home'),
      h('p', `key: ${location.key}`)
    ])
  }
}

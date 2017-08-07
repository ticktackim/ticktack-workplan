const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.home')

exports.needs = nest({
  'app.sync.goTo': 'first'
})

exports.create = (api) => {
  return nest('app.page.home', home)

  function home (location) {
    // location here can expected to be: { page: 'home' }
    const { goTo } = api.app.sync

    return h('div', [
      h('h1', 'Home'),
      h('div', { 'ev-click': () => goTo({ page: 'home' }) }, 'Home'),
      h('div', { 'ev-click': () => goTo({ type: 'group', key: '%sadlkjas;lkdjas' }) }, 'Group')
    ])
  }
}

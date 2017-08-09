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
      h('div', { 'ev-click': () => goTo({ type: 'group', key: '%sadlkjas;lkdjas' }) }, 'Group'),
      h('div', { 'ev-click': () => goTo({key: '%fXXZgQrwnj7F+Y19H0IXxNriuvPFoahvusih3UzpkfA=.sha256'}) }, 'Private Thread A'),
      h('div', { 'ev-click': () => goTo({key: '%3cWZHeN6k03XpvDBxrxP5bGLsNByFLTvr/rKYFV4f+c=.sha256'}) }, 'Private Thread B'),
    ])
  }
}

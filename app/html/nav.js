const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.html.nav')

exports.needs = nest({
  'history.sync.push': 'first',
  'history.sync.back': 'first'
})

exports.create = (api) => {
  return nest('app.html.nav', nav)

  function nav (id) {
    const { push, back } = api.history.sync
    return h('Nav', [
      h('div.back', { 'ev-click': back }, '←'),
      h('div', { 'ev-click': () => push({page: 'home'}) }, 'Home'),
      // h('div', { 'ev-click': () => push({type: 'group', key: '%sadlkjas;lkdjas'}) }, 'Group'),
      h('div', { 'ev-click': () => push({key: '%fXXZgQrwnj7F+Y19H0IXxNriuvPFoahvusih3UzpkfA=.sha256'}) }, 'Thread A'),
      h('div', { 'ev-click': () => push({key: '%3cWZHeN6k03XpvDBxrxP5bGLsNByFLTvr/rKYFV4f+c=.sha256'}) }, 'Thread B')
    ])
  }
}

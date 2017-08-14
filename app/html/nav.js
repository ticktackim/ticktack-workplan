const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.html.nav')

exports.needs = nest({
  'app.html.link': 'first',
  'history.sync.push': 'first',
  'history.sync.back': 'first'
})

exports.create = (api) => {
  return nest('app.html.nav', nav)

  function nav (id) {
    const { push, back } = api.history.sync

    const goHome = () => push({page: 'home'})
    // CHANGE THIS : zero history
    const Link = api.app.html.link

    return h('Nav', [
      h('div.back', { 'ev-click': back }, '←'),
      h('div', { 'ev-click': goHome }, 'Home'),
      Link({ page: 'settings' }, 'Settings'),
      Link({ page: 'userFind' }, 'Find a User'),
      h('a', { href: '%YRhFXmsAwipgyiwuHSP+EBr9fGjSqrMpWXUxgWcHxkM=.sha256' }, 'A Thread')
    ])
  }
}

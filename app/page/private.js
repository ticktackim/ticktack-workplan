const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.private')

exports.needs = nest({
  'app.sync.goTo': 'first',
  'app.html.thread': 'first'
})

exports.create = (api) => {
  return nest('app.page.private', private)

  function private (location) {
    // location here can expected to be an ssb-message
    const { goTo } = api.app.sync

    const thread = api.app.html.thread() 

    return h('div', [
      h('h1', 'Private message'),
      h('div', { 'ev-click': () => goTo({ page: 'home' }) }, 'Home'),
      thread
    ])
  }
}

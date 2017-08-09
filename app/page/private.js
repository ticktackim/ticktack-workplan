const nest = require('depnest')
const { h } = require('mutant')

const pull = require('pull-stream')
const dummyThread = require('../../test/fixtures/thread') 

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

    // TODO (mix) : swap for actual source, derived from location

    const id = '%fXXZgQrwnj7F+Y19H0IXxNriuvPFoahvusih3UzpkfA=.sha256'
    const thread = api.app.html.thread(id)

    return h('div', [
      h('h1', 'Private message'),
      h('div', { 'ev-click': () => goTo({ page: 'home' }) }, 'Home'),
      thread
    ])
  }
}

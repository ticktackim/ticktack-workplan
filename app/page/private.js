const nest = require('depnest')
const { h } = require('mutant')

const pull = require('pull-stream')

exports.gives = nest('app.page.private')

exports.needs = nest({
  'app.html.nav': 'first',
  'app.html.thread': 'first'
})

exports.create = (api) => {
  return nest('app.page.private', private)

  function private (location) {
    // location here can expected to be an ssb-message

    const thread = api.app.html.thread(location.key)

    return h('Page -private', [
      h('h1', 'Private message'),
      api.app.html.nav(),
      thread
    ])
  }
}

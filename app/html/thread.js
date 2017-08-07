const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.html.thread')

exports.needs = nest({
  'app.sync.goTo': 'first'
})

exports.create = (api) => {
  return nest('app.html.thread', thread)

  function thread (source) {
    // location here can expected to be: { page: 'home' }
    const { goTo } = api.app.sync

    return h('Thread', [
      'thread content'
    ])
  }
}


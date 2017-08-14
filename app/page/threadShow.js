const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.threadShow')

exports.needs = nest({
  'app.html.nav': 'first',
  'app.html.thread': 'first'
})

exports.create = (api) => {
  return nest('app.page.threadShow', threadShow)

  function threadShow (location) {
    // location here can expected to be an ssb-message

    const thread = api.app.html.thread(location.key)

    return h('Page -threadShow', [
      h('h1', 'Private message'),
      api.app.html.nav(),
      h('div.container', thread)
    ])
  }
}

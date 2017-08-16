const nest = require('depnest')
const { h } = require('mutant')
const last = require('lodash/last')
const get = require('lodash/get')

exports.gives = nest('app.page.threadShow')

exports.needs = nest({
  'app.html.nav': 'first',
  'app.html.thread': 'first',
  'message.html.compose': 'first'
})

exports.create = (api) => {
  return nest('app.page.threadShow', threadShow)

  function threadShow (location) {
    // location = a thread (message decorated with replies)
    const { key: root, replies, channel } = location

    const thread = api.app.html.thread(root)

    const meta = {
      type: 'post',
      root,
      branch: get(last(location.replies), 'key'), // >> lastId? CHECK THIS LOGIC
      channel,
      recps: get(location, 'value.content.recps')
    }
    const composer = api.message.html.compose({ meta, shrink: false })

    return h('Page -threadShow', [
      h('h1', 'Private message'),
      api.app.html.nav(),
      h('div.container', [
        thread,
        composer
      ]),
    ])
  }
}

const nest = require('depnest')
const { h, computed } = require('mutant')
const last = require('lodash/last')
const get = require('lodash/get')

exports.gives = nest('app.page.threadShow')

exports.needs = nest({
  'translations.sync.strings': 'first',
  'app.html.thread': 'first',
  'message.html.compose': 'first'
})

exports.create = (api) => {
  var strings = api.translations.sync.strings()

  return nest('app.page.threadShow', threadShow)

  function threadShow (location) {
    // location = a thread (message decorated with replies)
    const { key: root, replies, channel } = location

    const thread = api.app.html.thread(root)

    const meta = {
      type: 'post',
      root,
      branch: get(last(location.replies), 'key'),
      // >> lastId? CHECK THIS LOGIC
      channel: channel,
      recps: get(location, 'value.content.recps')
    }
    const composer = api.message.html.compose({ meta, shrink: false })
    const subject = computed(thread.subject, subject => subject || strings.threadShow)

    return h('Page -threadShow', [
      h('div.container', [
        h('h1', subject),
        thread,
        composer
      ]),
    ])
  }
}



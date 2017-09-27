const nest = require('depnest')
const { h, computed } = require('mutant')
const last = require('lodash/last')
const get = require('lodash/get')

exports.gives = nest('app.page.threadShow')

exports.needs = nest({
  'app.html.context': 'first',
  'app.html.thread': 'first',
  'translations.sync.strings': 'first',
  'message.html.compose': 'first'
})

exports.create = (api) => {
  var strings = api.translations.sync.strings()

  return nest('app.page.threadShow', threadShow)

  function threadShow (location) {
    console.log(location)
    // location = a thread (message, may be decorated with replies)
    const { key, value } = location
    const root = get(value, 'content.root', key)
    const channel = get(value, 'content.channel')

    const thread = api.app.html.thread(root)

    const meta = {
      type: 'post',
      root,
      branch: get(last(location.replies), 'key'),
      // >> lastId? CHECK THIS LOGIC
      channel,
      recps: get(location, 'value.content.recps')
    }
    const composer = api.message.html.compose({ meta, shrink: false })
    const subject = computed(thread.subject, subject => subject || strings.threadShow)

    return h('Page -threadShow', [
      api.app.html.context(location),
      h('div.content', [
        h('h1', subject),
        thread,
        composer
      ]),
    ])
  }
}



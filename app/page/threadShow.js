const nest = require('depnest')
const { h, computed, when } = require('mutant')
const last = require('lodash/last')
const get = require('lodash/get')

exports.gives = nest('app.page.threadShow')

exports.needs = nest({
  'about.html.avatar': 'first',
  'app.html.sideNav': 'first',
  'app.html.thread': 'first',
  'message.html.compose': 'first',
  'unread.sync.markRead': 'first',
  'feed.obs.thread': 'first'
})

exports.create = (api) => {
  return nest('app.page.threadShow', threadShow)

  function threadShow (location) {
    // location = a thread (message, may be decorated with replies)
    const { key, value } = location
    const root = get(value, 'content.root', key)
    const channel = get(value, 'content.channel')

    //unread state is set in here...
    const thread = api.feed.obs.thread(root)
    const subject = get(location, 'value.content.subject')
    const recps = get(location, 'value.content.recps')

    const meta = {
      type: 'post',
      root,
      branch: thread.lastId,
      channel,
      recps
    }
    const composer = api.message.html.compose({ meta, thread, shrink: false })

    return h('Page -threadShow', [
      api.app.html.sideNav(location),
      h('div.content', [
        h('header', [
          when(subject, h('h1', subject)),
          Recipients(recps),
        ]),
        api.app.html.thread(thread),
        composer
      ]),
    ])
  }

  function Recipients (recps) {
    if (recps && recps.length > 2)
      return h('div.recps', recps.map(r => {
        const recp = typeof r === 'string' ? r : r.link
        return api.about.html.avatar(recp, 'tiny')
      }))
  }
}


const nest = require('depnest')
const { h, Value, onceTrue } = require('mutant')
const get = require('lodash/get')
const getType = (msg) => get(msg, 'value.content.type')
const getLikeRoot = (msg) => get(msg, 'value.content.vote.link')
const getShareRoot = (msg) => get(msg, 'value.content.share.link')
const getRoot = (msg) => {
  switch (getType(msg)) {
    case 'vote':
      return getLikeRoot(msg)
    case 'share':
      return getShareRoot(msg)
  }
}

exports.gives = nest('message.html.notification')

exports.needs = nest({
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'blog.html.title': 'first',
  // 'message.html.markdown': 'first',
  'message.html.timeago': 'first',
  'message.html.likes': 'first',
  'unread.sync.markRead': 'first',
  'unread.sync.isUnread': 'first',
  'sbot.obs.connection': 'first',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest('message.html.notification', Notification)

  function Notification (msg) {
    var root = getRoot(msg)
    if (!root) return

    const { author } = msg.value

    var className = api.unread.sync.isUnread(msg) ? ' -unread' : ' -read'
    api.unread.sync.markRead(msg)

    var title = Value()
    processMessage(root, msg => {
      var t = api.blog.html.title(msg)
      title.set(t.innerText ? t.innerText : t)
    })

    return h('Notification', { className }, [
      h('div.left', api.about.html.avatar(author, 'tiny')),
      h('div.right', [
        h('section.context', [
          h('div.name', api.about.obs.name(author)),
          api.message.html.timeago(msg),
          h('a.rootLink', {href: root}, ['<< ', title, ' >>'])
        ])
        // TODO display the share text ??
        // h('section.content', api.message.html.markdown(get(msg, 'value.content.text'))),
      ])
    ])
  }

  function processMessage (key, fn) {
    onceTrue(api.sbot.obs.connection, server => server.get(key, (err, value) => {
      if (err) return console.error(err)
      fn({ key, value })
    }))
  }
}

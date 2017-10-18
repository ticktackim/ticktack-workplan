const nest = require('depnest')
const { h, Array: MutantArray, map, computed, when, resolve } = require('mutant')
const get = require('lodash/get')

exports.gives = nest('app.html.comments')

exports.needs = nest({
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'feed.obs.thread': 'first',
  'keys.sync.id': 'first',
  'message.html.markdown': 'first',
  'message.html.timeago': 'first',
  'message.html.likes': 'first',
  'unread.sync.markRead': 'first',
  'unread.sync.isUnread': 'first',
})

exports.create = (api) => {
  return nest('app.html.comments', comments)

  function comments (root) {
    const myId = api.keys.sync.id()
    const { messages } = api.feed.obs.thread(root)

    return h('Comments',
      map(messages, Comment)
    )

    function Comment (msgObs) {
      const msg = resolve(msgObs)
      const raw = get(msg, 'value.content.text')
      var className = api.unread.sync.isUnread(msg) ? ' -unread' : ' -read'
      api.unread.sync.markRead(msg)

      if (!get(msg, 'value.content.root')) return

      const { author } = msg.value
      return h('Comment', { className }, [
        h('div.left', api.about.html.avatar(author, 'tiny')),
        h('div.right', [
          h('section.context', [
            h('div.name', api.about.obs.name(author)),
            api.message.html.timeago(msg)
          ]),
          h('section.content', api.message.html.markdown(raw)),
          h('section.actions', [
            h('div.reply', [ 
              h('i.fa.fa-commenting-o'),
            ]),
            api.message.html.likes(msg)
          ])
        ])
      ])
    }
  }
}


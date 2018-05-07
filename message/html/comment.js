const nest = require('depnest')
const { h, Value, map, when, resolve, computed, onceTrue } = require('mutant')
const get = require('lodash/get')
const { heads } = require('ssb-sort')

exports.gives = nest('message.html.comment')

exports.needs = nest({
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'backlinks.obs.for': 'first',
  'blog.html.title': 'first',
  'message.html.compose': 'first',
  'message.html.markdown': 'first',
  'message.html.timeago': 'first',
  'message.html.likes': 'first',
  'unread.sync.markRead': 'first',
  'unread.sync.isUnread': 'first',
  'sbot.obs.connection': 'first',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest('message.html.comment', Comment)

  function Comment ({ comment, replies, branch, showRootLink = false }) {
    const strings = api.translations.sync.strings()
    const msg = resolve(comment)
    var root = get(msg, 'value.content.root')
    if (!root) return

    const { author, content } = msg.value

    if (!replies) {
      replies = computed(api.backlinks.obs.for(msg.key), backlinks => {
        return backlinks.filter(backlinker => {
          const { type, root } = backlinker.value.content
          return type === 'post' && root === msg.key
        })
      })
    }
    if (!branch) {
      branch = computed(api.backlinks.obs.for(root), backlinks => {
        return heads(backlinks)
      })
    }

    var className = api.unread.sync.isUnread(msg) ? ' -unread' : ' -read'
    api.unread.sync.markRead(msg)

    var title = Value()
    if (showRootLink) {
      processMessage(root, msg => {
        var t = api.blog.html.title(msg)
        title.set(t.innerText ? t.innerText : t)
      })
    }

    var nestedReplyCompose = Value(false)
    const toggleCompose = () => nestedReplyCompose.set(!nestedReplyCompose())
    const nestedReplyComposer = api.message.html.compose({
      meta: {
        type: 'post',
        root,
        fork: msg.key,
        branch,
        channel: content.channel
      },
      shrink: false,
      canAttach: true,
      canPreview: false,
      placeholder: strings.writeComment
    }, toggleCompose)

    return h('Comment', { className }, [
      h('div.left', api.about.html.avatar(author, 'tiny')),
      h('div.right', [
        h('section.context', [
          h('div.name', api.about.obs.name(author)),
          api.message.html.timeago(msg),
          when(showRootLink, h('a.rootLink', {href: root}, ['<< ', title, ' >>']))
          // TODO don't link to root, link to position of message within blog!
        ]),
        h('section.content', api.message.html.markdown(get(msg, 'value.content.text'))),
        when(replies,
          h('section.replies',
            map(
              replies,
              NestedComment,
              {
                comparer: (a, b) => {
                  if (a === undefined || b === undefined) return false
                  return a.key === b.key
                }
              }
            )
          )
        ),
        h('section.actions', [
          h('div.reply', { 'ev-click': toggleCompose }, [
            h('i.fa.fa-commenting-o')
          ]),
          api.message.html.likes(msg)
        ]),
        when(nestedReplyCompose, nestedReplyComposer)
      ])
    ])
  }

  function NestedComment (comment) {
    const msg = resolve(comment)
    const raw = get(msg, 'value.content.text')
    if (!raw) return

    const { author } = msg.value

    return h('Comment -nested', [
      h('div.left'),
      h('div.right', [
        h('section.context', [
          h('div.name', api.about.obs.name(author)),
          api.message.html.timeago(msg)
        ]),
        h('section.content', api.message.html.markdown(raw))
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

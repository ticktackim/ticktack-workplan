const nest = require('depnest')
const { h, Value, map, when, resolve } = require('mutant')
const get = require('lodash/get')

exports.gives = nest('message.html.comment')

exports.needs = nest({
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  // 'backlinks.obs.for': 'first',
  'message.html.compose': 'first',
  'message.html.markdown': 'first',
  'message.html.timeago': 'first',
  'message.html.likes': 'first',
  'unread.sync.markRead': 'first',
  'unread.sync.isUnread': 'first',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest('message.html.comment', Comment)

  function Comment ({ comment: msgObs, replies, branch }) {
    const strings = api.translations.sync.strings()
    const msg = resolve(msgObs)

    const raw = get(msg, 'value.content.text')
    var className = api.unread.sync.isUnread(msg) ? ' -unread' : ' -read'
    api.unread.sync.markRead(msg)

    var root = get(msg, 'value.content.root')
    if (!root) return

    const { author, content } = msg.value

    // // TODO - move this upstream into patchcore:feed.obs.thread ??
    // // OR change strategy to use forks
    // const backlinks = api.backlinks.obs.for(msg.key)
    // const nestedReplies = computed(backlinks, backlinks => {
    //   return backlinks.filter(backlinker => {
    //     const { type, root } = backlinker.value.content
    //     return type === 'post' && root === msg.key
    //   })
    // })

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
          api.message.html.timeago(msg)
        ]),
        h('section.content', api.message.html.markdown(raw)),
        when(replies,
          h('section.replies',
            map(
              replies,
              NestedComment,
              { comparer: (a, b) => a === b }
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

  function NestedComment (msgObs) {
    const msg = resolve(msgObs)
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
}

function forkOf (msg) {
  return get(msg, 'value.content.fork')
}


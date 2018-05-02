const nest = require('depnest')
const { h, map, Struct, computed, throttle } = require('mutant')
const get = require('lodash/get')

exports.gives = nest('app.html.comments')

exports.needs = nest({
  'message.html.comment': 'first',
  'message.html.compose': 'first',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest('app.html.comments', comments)

  function comments (thread) {
    const strings = api.translations.sync.strings()
    const { messages, channel, lastId: branch } = thread

    // TODO - move this up into Patchcore
    const messagesTree = computed(throttle(messages, 200), msgs => {
      return msgs
        .filter(msg => forkOf(msg) === undefined) // exclude nested replies / forks
        .filter(msg => msg.value.content.root) // exclude root message / blog
        .map(comment => {
          const nestedReplies = msgs.filter(msg => forkOf(msg) === comment.key)

          return Struct({
            comment: comment,
            replies: nestedReplies
          })
          // return Object.assign({}, comment, { replies: nestedReplies })
        })
    })

    const root = computed(messages, ary => ary[0].key)

    const meta = {
      type: 'post',
      root,
      branch,
      channel
    }
    // const twoComposers = computed(messages, messages => {
    //   return messages.length > 5
    // })
    const { compose } = api.message.html

    const feedIdsInThread = computed(thread.messages, msgs => {
      return msgs.map(m => m.value.author)
    })

    return h('Comments', [
      // when(twoComposers, compose({ meta, shrink: true, canAttach: false })),
      map(
        messagesTree,
        msg => api.message.html.comment({ comment: msg.comment, replies: msg.replies, branch }),
        {
          comparer: (a, b) => {
            if (a === undefined || b === undefined) return false

            return a.comment() === b.comment() && a.replies().length === b.replies().length
          }
        }
      ),
      compose({ meta, feedIdsInThread, shrink: false, canAttach: true, placeholder: strings.writeComment })
    ])
  }
}

function forkOf (msg) {
  return get(msg, 'value.content.fork')
}

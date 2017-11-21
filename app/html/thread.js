const nest = require('depnest')
const { h, Array: MutantArray, map, computed, when } = require('mutant')
const get = require('lodash/get')

// TODO - rename threadPrivate
exports.gives = nest('app.html.thread')

exports.needs = nest({
  'about.html.avatar': 'first',
  'feed.obs.thread': 'first',
  'keys.sync.id': 'first',
  'message.html.markdown': 'first',
  'unread.sync.markRead': 'first',
  'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  return nest('app.html.thread', thread)

  function thread (root) {
    const myId = api.keys.sync.id()
    const thread = api.feed.obs.thread(root)
    const chunkedMessages = buildChunkedMessages(thread.messages)

    const threadView = h('Thread',
      map(chunkedMessages, chunk => {
        const author = computed([chunk], chunk => get(chunk, '[0].value.author'))

        return author() === myId
          ? h('div.my-chunk', [
            h('Avatar -small'),
            h('div.msgs', map(chunk, msg => {
              return h('div.msg-row', [
                h('div.spacer'),
                message(msg)
              ])
            }))
          ])
          : h('div.other-chunk', [
            when(author, api.about.html.avatar(author()), 'small'),
            h('div.msgs', map(chunk, msg => {
              return h('div.msg-row', [
                message(msg),
                h('div.spacer')
              ])
            }))
          ])
      })
    )

    function message (msg) {
      const raw = get(msg, 'value.content.text')
      var unread = api.unread.sync.isUnread(msg) ? ' -unread' : ''
      api.unread.sync.markRead(msg)
      return h('div.msg'+unread, api.message.html.markdown(raw))
    }

    threadView.subject = computed(thread.messages, msgs => {
      return get(msgs, '[0].value.content.subject')
    })
    return threadView
  }
}

function buildChunkedMessages (messagesObs) {
  return computed(messagesObs, msgs => {
    var chunkedMessages = MutantArray()

    var _chunk = null
    var _lastMsg = null

    msgs.forEach(msg => {
      const text = get(msg, 'value.content.text')
      if (!text) return

      if (!_lastMsg || !isSameAuthor(_lastMsg, msg)) {
        createNewChunk(msg)
      } else {
        _chunk.push(msg)
      }

      _lastMsg = msg
    })

    function createNewChunk (msg) {
      const newChunk = MutantArray()
      newChunk.push(msg)
      chunkedMessages.push(newChunk)
      _chunk = newChunk
    }

    return chunkedMessages
  })
}

function isSameAuthor (msgA, msgB) {
  // TODO (mix) use lodash/get
  return msgA.value.author === msgB.value.author
}


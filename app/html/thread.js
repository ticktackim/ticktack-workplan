const nest = require('depnest')
const { h, Array: MutantArray, map, computed, when } = require('mutant')
const pull = require('pull-stream')
const last = require('lodash/last')
const get = require('lodash/get')

exports.gives = nest('app.html.thread')

exports.needs = nest({
  'about.html.image': 'first',
  'app.sync.goTo': 'first',
  'feed.obs.thread': 'first',
  'message.html.markdown': 'first'
})

exports.create = (api) => {
  return nest('app.html.thread', thread)

  function thread (id) {
    // location here can expected to be: { page: 'home' }


    var myId = '@EMovhfIrFk4NihAKnRNhrfRaqIhBv1Wj8pTxJNgvCCY=.ed25519'
    // TODO (mix) use keys.sync.id

    const thread = api.feed.obs.thread(id)
    const chunkedMessages = buildChunkedMessages(thread.messages)

    const { goTo } = api.app.sync
    const threadView = h('Thread', 
      map(chunkedMessages, chunk => {
        const author = get(chunk, '[0].value.author')

        return author === myId
          ? h('div.my-chunk', [
              h('div.avatar'),
              h('div.msgs', map(chunk,  msg => {
                return h('div.msg-row', [
                  h('div.spacer'),
                  message(msg)
                ])
              }))
            ])
          : h('div.other-chunk', [
              h('div.avatar', when(author, api.about.html.image(author))),
              h('div.msgs', map(chunk,  msg => {
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

      return h('div.msg', api.message.html.markdown(raw))
    }

    return threadView
  }
}

function buildChunkedMessages (messagesObs) {
  return computed(messagesObs, msgs => {
    var chunkedMessages = MutantArray()

    var _chunk = null 
    var _lastMsg = null
    
    msgs.forEach(msg => {
      if (!_lastMsg || !isSameAuthor(_lastMsg, msg))
        createNewChunk(msg)
      else 
        _chunk.push(msg)

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



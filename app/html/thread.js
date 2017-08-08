const nest = require('depnest')
const { h, Array: MutantArray, map, computed, when } = require('mutant')
const pull = require('pull-stream')
const last = require('lodash/last')
const get = require('lodash/get')

exports.gives = nest('app.html.thread')

exports.needs = nest({
  'about.html.image': 'first',
  'app.sync.goTo': 'first',
  'message.html.markdown': 'first'
})

exports.create = (api) => {
  return nest('app.html.thread', thread)

  function thread (source) {
    // location here can expected to be: { page: 'home' }

    const chunkedThread = buildChunkedThreadObs(source)

    var myId = '@EMovhfIrFk4NihAKnRNhrfRaqIhBv1Wj8pTxJNgvCCY=.ed25519'
    // TODO (mix) use keys.sync.id

    const { goTo } = api.app.sync
    const threadView = h('Thread', 
      map(chunkedThread, chunk => {

        return computed(chunk, chunk => {
          const author = get(chunk, '[0].value.author')
          if (author === myId) {
            return h('div.my-chunk', [
              h('div.avatar'),
              h('div.msgs', map(chunk,  msg => {
                return h('div.msg-row', [
                  h('div.spacer'),
                  message(msg)
                ])
              }))
            ])
          } else {
            return h('div.other-chunk', [
              h('div.avatar', api.about.html.image(author)),
              h('div.msgs', map(chunk,  msg => {
                return h('div.msg-row', [
                  message(msg),
                  h('div.spacer')
                ])
              }))
            ])
          }
        })
      })
    )

    function message (msg) {
      const raw = get(msg, 'value.content.text')

      return h('div.msg', api.message.html.markdown(raw))
    }

    return threadView
  }
}

function buildChunkedThreadObs (source) {
  var chunkedThread = MutantArray()

  var _chunk = null 
  var _lastMsg = null
  
  pull(
    source,
    pull.drain(msg => {
      if (!_lastMsg || !isSameAuthor(_lastMsg, msg))
        createNewChunk(msg)
      else 
        _chunk.push(msg)

      _lastMsg = msg
    })
  )

  function createNewChunk (msg) {
    const newChunk = MutantArray()
    newChunk.push(msg)
    chunkedThread.push(newChunk)
    _chunk = newChunk
  }

  return chunkedThread
}

function isSameAuthor (msgA, msgB) {
  // TODO (mix) use lodash/get
  return msgA.value.author === msgB.value.author
}



const nest = require('depnest')
const { h, Array: MutantArray, map } = require('mutant')
const pull = require('pull-stream')
const last = require('lodash/last')
const get = require('lodash/last')

exports.gives = nest('app.html.thread')

exports.needs = nest({
  'app.sync.goTo': 'first'
})

exports.create = (api) => {
  return nest('app.html.thread', thread)

  function thread (source) {
    // location here can expected to be: { page: 'home' }

    const chunkedThread = buildChunkedThreadObs(source)

    const { goTo } = api.app.sync
    const threadView = h('Thread', 
      map(chunkedThread, chunk => {
        return h('div' , [
          h('div', '---'),

          map(chunk,  msg => {
            return h('div', {style: { margin: '10px', background: 'white' }}, msg.value.content.text) // TODO (mix): use lodash/get
          })
        ])
      })
    )

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


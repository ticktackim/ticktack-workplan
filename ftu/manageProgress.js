const pull = require('pull-stream')
const Client = require('ssb-client')
const Path = require('path')
const get = require('lodash/get')
const map = require('lodash/map')
const { resolve, watch } = require('mutant')
const mapLimit = require('map-limit')

function manageProgress ({ state, config }) {
  const { peersLatestSequence } = require(Path.join(config.path, 'importing.json'))

  Client(config.keys, config, (err, sbot) => {
    if (err) return console.error('problem starting client', err)

    console.log('> sbot running!!!!')

    watchCurrentSequence({ sbot, state })
    watchLatestSequence({ sbot, period: 5000, state })
    watchPeersLatestSequence({ sbot, peersLatestSequence, period: 10000, state })

    // pull(
    //   sbot.replicate.changes(),
    //   pull.log()
    // )

    // watch progress (db size) ??
    // sbot.progress(console.log)
    //
    sbot.gossip.peers((err, peers) => {
      if (err) return console.error(err)

      connectToPeers({ sbot, peers, state })
    })
  })
}

function connectToPeers ({ sbot, peers, state }) {
  if (peers.length > 10) {
    const lessPeers = peers.filter(p => !p.error)
    if (lessPeers.length > 10) peers = lessPeers
    console.log('CONNECTING TO PEERS:', peers.length)
  }

  peers.forEach(({ host, port, key }) => {
    if (host && port && key) {
      sbot.gossip.connect({ host, port, key }, (err, v) => {
        if (err) console.log('error connecting to ', host, err)
        else console.log('connected to ', host)
      })
    }
  })
}

function watchCurrentSequence ({ sbot, state }) {
  var sink = pull.drain((msg) => {
    let seq = get(msg, 'value.sequence', false)
    if (seq) state.mySequence.current.set(seq)
  })

  pull(
    sbot.createUserStream({ live: true, id: sbot.id }),
    sink
  )

  watch(state.importComplete, importComplete => {
    if (importComplete) sink.abort(() => console.log('stopping watchCurrentSequence'))
  })
}

function watchLatestSequence ({ sbot, period, state }) {
  const feedId = sbot.id
  sbot.ebt.peerStatus(feedId, (err, data) => {
    if (err) return setTimeout(() => watchLatestSequence({ sbot, period, state }), period)

    const currentLatest = resolve(state.mySequence.latest)

    const remoteSeqs = map(data.peers, (val) => val.seq)
      .filter(s => s >= currentLatest)       // only keep remote seq that confirm or update backup seq
      .sort((a, b) => a > b ? -1 : 1) // order them

    console.log('mySequence.latest', resolve(state.mySequence.latest), remoteSeqs)
    const newLatest = remoteSeqs[0]
    if (newLatest && newLatest >= resolve(state.mySequence.latest)) {
      state.mySequence.latest.set(newLatest)

      // if this value is confirmed remotely twice, assume safe
      if (remoteSeqs.filter(s => s === newLatest).length >= 2) {
        state.mySequence.latestConfirmed.set(true)
      }
    }

    if (resolve(state.importComplete)) return

    setTimeout(() => watchLatestSequence({ sbot, period, state }), period)
  })
}

function watchPeersLatestSequence ({ sbot, peersLatestSequence, period, state }) {
  mapLimit(Object.keys(peersLatestSequence), 5,
    (id, cb) => sbot.latestSequence(id, (err, seq) => {
      if (err && err.message && err.message.indexOf('not found') > -1) {
        return cb(null, null) // don't include this user
      }
      if (err) return cb(err)
      cb(null, [id, seq])
    }),
    (err, data) => {
      if (err) return setTimeout(() => watchPeersLatestSequence({ sbot, peersLatestSequence, period, state }), period)

      const results = data
        .filter(Boolean)
        .reduce((soFar, d) => {
          soFar.current = soFar.current + d[1]
          soFar.latest = soFar.latest + peersLatestSequence[d[0]]

          return soFar
        }, { current: 0, latest: 0 })

      state.peerSequences.set(results) // NOT WORKING yet

      // const results = data
      //   .filter(Boolean)
      //   .reduce((soFar, d) => {
      //     soFar[d[0]] = {
      //       progress: d[1],
      //       total: peersLatestSequence[d[0]]
      //     }
      //     return soFar
      //   }, {})
      // console.log('progress', results)

      if (resolve(state.importComplete)) return

      setTimeout(() => watchPeersLatestSequence({ sbot, peersLatestSequence, period, state }), period)
    }
  )

  // NOTE this would be to do something with remote state of peers
  // Object.keys(peersLatestSequence).forEach(peerId => {
  //   sbot.ebt.peerStatus(peerId, (err, data) => {
  //     if (err) return
  //     const currentLatest = peersLatestSequence[peerId]

  //     const remoteSeq = map(data.peers, (val) => val.seq)
  //       .filter(s => s >= currentLatest)
  //       .sort((a, b) => a > b ? -1 : 1)
  //       .shift()

  //     console.log(peerId, currentLatest, remoteSeq)
  //   })
  // })

}

module.exports = manageProgress

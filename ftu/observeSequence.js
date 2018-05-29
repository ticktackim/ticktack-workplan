const get = require('lodash/get')
const pull = require('pull-stream')
const Client = require('ssb-client')
const { resolve } = require('mutant')

function observeSequence ({ state, timeout }) {
  const config = require('../config').create().config.sync.load()

  Client(config.keys, config, (err, ssbServer) => {
    if (err) return console.error('problem starting client', err)

    console.log('> sbot running!!!!')

    ssbServer.gossip.peers((err, peers) => {
      if (err) return console.error(err)

      connectToPeers(peers)
      checkPeers()
    })

    // start listening to the my seq, and update the state
    pull(
      ssbServer.createUserStream({ live: true, id: ssbServer.id }),
      pull.drain((msg) => {
        let seq = get(msg, 'value.sequence', false)
        if (seq) {
          state.currentSequence.set(seq)
        }
      })
    )

    function connectToPeers (peers) {
      if (peers.length > 10) {
        const lessPeers = peers.filter(p => !p.error)
        if (lessPeers.length > 10) peers = lessPeers
      }

      peers.forEach(({ host, port, key }) => {
        if (host && port && key) {
          ssbServer.gossip.connect({ host, port, key }, (err, v) => {
            if (err) console.log('error connecting to ', host, err)
            else console.log('connected to ', host)
          })
        }
      })
    }

    function checkPeers () {
      ssbServer.ebt.peerStatus(ssbServer.id, (err, data) => {
        if (err) {
          timeout = setTimeout(checkPeers, 5000)
          return
        }

        const latest = resolve(state.latestSequence)

        const remoteSeqs = Object.keys(data.peers)
          .map(p => data.peers[p].seq)    // get my seq reported by each peer
          .filter(s => s >= latest)       // only keep remote seq that confirm or update backup seq
          .sort((a, b) => a > b ? -1 : 1) // order them

        // console.log(remoteSeqs)

        const newLatest = remoteSeqs[0]
        if (newLatest) {
          state.latestSequence.set(newLatest)

          // if this value is confirmed remotely twice, assume safe
          if (remoteSeqs.filter(s => s === newLatest).length >= 2) {
            state.confirmedRemotely.set(true)
          }
        }

        timeout = setTimeout(checkPeers, 5000)
      })
    }
  })
}

module.exports = observeSequence

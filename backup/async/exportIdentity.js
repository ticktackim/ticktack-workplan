const nest = require('depnest')
const { onceTrue } = require('mutant')
const path = require('path')
const fs = require('fs')
const parallel = require('run-parallel')
const mapLimit = require('map-limit')

const config = require('../../config').create().config.sync.load()
const gossipFile = path.join(config.path, 'gossip.json')
const secretFile = path.join(config.path, 'secret')

exports.gives = nest('backup.async.exportIdentity')

exports.needs = nest({
  'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  return nest('backup.async.exportIdentity', (filename, cb) => {
    if (typeof filename === 'undefined') return cb(new Error('backup requires a filename'))

    console.log(`should export identity to file ${filename}`)

    var backup = {
      exportDate: new Date().toISOString(),
      secret: fs.readFileSync(secretFile, 'utf8'),
      gossip: require(gossipFile)
    }

    onceTrue(api.sbot.obs.connection, sbot => {
      parallel([
        getLatestSequence,
        getGossipFollowers,
        getPeersLatestSequence
      ], save)

      function getLatestSequence (done) {
        sbot.latestSequence(sbot.id, (err, seq) => {
          if (err) return done(err)

          backup.mySequence = { latest: seq }
          done(null)
        })
      }

      function getGossipFollowers (done) {
        // the peers in gossip list who follow me
        sbot.friends.get({ dest: sbot.id }, (err, followers) => {
          if (err) return done(err)

          backup.gossip.forEach(record => {
            if (followers[record.key]) record.followsMe = true
          })

          done(null)
        })
      }

      function getPeersLatestSequence (done) {
        sbot.friends.get({ source: sbot.id }, (err, d) => {
          if (err) return done(err)

          var follows = Object.keys(d).filter(id => d[id] === true)

          mapLimit(follows, 5,
            (id, cb) => sbot.latestSequence(id, (err, seq) => {
              if (err && err.message && err.message.indexOf('not found') > 0) {
                console.error(err)
                return cb(null, null) // don't include this user
              }
              if (err) return cb(err)

              cb(null, [ id, seq ])
            }),
            (err, peers) => {
              if (err) return done(err)

              // TODO change
              backup.peersLatestSequence = peers
                .filter(Boolean)
                .reduce((soFar, [ id, seq ]) => {
                  if (seq) soFar[id] = seq
                  return soFar
                }, {})
              done(null)
            }
          )
        })
      }
    })

    function save (err, success) {
      if (err) return cb(err)

      fs.writeFileSync(filename, JSON.stringify(backup, null, 2), 'utf8')
      cb(null, true)
    }

    return true
  })
}

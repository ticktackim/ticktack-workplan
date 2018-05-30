const nest = require('depnest')
const { onceTrue } = require('mutant')
const path = require('path')
const fs = require('fs')
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
      // gossip: JSON.parse(fs.readFileSync(gossipFile)),
    }

    onceTrue(api.sbot.obs.connection, sbot => {
      sbot.latestSequence(sbot.id, (err, seq) => {
        if (err) return cb(err)

        backup.latestSequence = seq

        sbot.friends.get({ source: sbot.id }, (err, d) => {
          if (err) return cb(err)

          console.log(Object.keys(d).length)
          var follows = Object.keys(d).filter(id => d[id] === true)
          console.log(follows.length)

          mapLimit(follows, 10,
            (id, cb) => sbot.latestSequence(id, (err, seq) => {
              if (err && err.message && err.message.indexOf('not found') > 0) {
                console.error(err)
                cb(null, null) // don't include this user
              } else cb(null, [ id, seq ])
            }),
            (err, peers) => {
              if (err) return cb(err)

              console.log(peers.length)
              backup.peersSequence = peers
                .filter(Boolean)
                .reduce((soFar, [ id, seq ]) => {
                  if (seq) soFar[id] = seq
                  return soFar
                }, {})

              console.log(Object.keys(backup.peersSequence).length)

              fs.writeFileSync(filename, JSON.stringify(backup, null, 2), 'utf8')
              cb(null, true)
            }
          )
        })
      })
    })
    return true
  })
}

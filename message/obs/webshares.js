var nest = require('depnest')
var ref = require('ssb-ref')
var MutantArray = require('mutant/array')
var concat = require('mutant/concat')

var { computed } = require('mutant')

exports.needs = nest({
  'message.sync.unbox': 'first',
  'backlinks.obs.for': 'first'
})

exports.gives = nest({
  'sbot.hook.publish': true,
  'message.obs.webshares': true
})


function isShare(c) {
  if (c.type !== 'share') return false

  if (!c.share || !c.share.link || !ref.isMsg(c.share.link) || !c.share.hasOwnProperty('url')) {
    return false
  }

  return true
}


exports.create = function (api) {
  var activeShares = new Set()
  return nest({
    'sbot.hook.publish': (msg) => {
      if (!(msg && msg.value && msg.value.content)) return
      if (typeof msg.value.content === 'string') {
        msg = api.message.sync.unbox(msg)
        if (!msg) return
      }

      var c = msg.value.content

      if (!isShare(c)) return

      activeShares.forEach((shares) => {
        if (shares.id === c.share.link) {
          shares.push(msg)
        }
      })
    },
    'message.obs.webshares': (id) => {
      if (!ref.isLink(id)) throw new Error('an id must be specified')
      var obs = get(id)
      obs.id = id
      var result = computed(obs, getShares, {
        // allow manual append for simulated realtime
        onListen: () => activeShares.add(obs),
        onUnlisten: () => activeShares.delete(obs)
      })
      result.sync = obs.sync
      return result
    }
  })

  function get(id) {
    var backlinks = api.backlinks.obs.for(id)
    var merge = MutantArray()

    var shares = computed([backlinks.sync, concat([backlinks, merge])], (sync, backlinks) => {
      if (sync) {
        return backlinks.reduce((result, msg) => {
          var c = msg.value.content
          if (isShare(c) && c.share.link === id) {
            var value = result[msg.value.author]
            if (!value || value[0] < msg.value.timestamp) {
              result[msg.value.author] = [msg.value.timestamp, c.share.url]
            }
          }
          return result
        }, {})
      } else {
        return {}
      }
    })

    shares.push = merge.push
    shares.sync = backlinks.sync
    return shares
  }
}

function getShares(shares) {
  return Object.keys(shares).reduce((result, id) => {
    if (shares[id].length >= 1) {
      result.push(id)
    }
    return result
  }, [])
}
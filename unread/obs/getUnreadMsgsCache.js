var nest = require('depnest')
const { Dict, Set } = require('mutant')

exports.gives = nest({
  'unread.obs.getUnreadMsgsCache': true
})

exports.needs = nest({
  'unread.sync.saveStore': 'first'
})

// load current state of unread messages.

exports.create = function (api) {
  var unreadMsgsCache = Dict() // { id: [ msgs ] }

  return nest({
    'unread.obs.getUnreadMsgsCache': getCache
  })

  function getCache (key) {
    if (!key) return unreadMsgsCache

    var cache = unreadMsgsCache.get(key)
    if (!cache) {
      cache = Set()
      unreadMsgsCache.put(key, cache)
    }
    return cache
  }
}

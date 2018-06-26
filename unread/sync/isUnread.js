var nest = require('depnest')

exports.gives = nest({
  'unread.sync.isUnread': true
})

exports.needs = nest({
  'unread.sync.getStore': 'first'
})

// load current state of unread messages.

exports.create = function (api) {
  return nest({
    'unread.sync.isUnread': isUnread
  })

  function isUnread (msg) {
    const store = api.unread.sync.getStore()
    if (msg.timestamp && msg.timestamp < store.timestamp) return false
    return !store.filter[msg.key]
  }

  function markRead (msg) {
    const store = api.unread.sync.getStore()
    if (msg && typeof msg.key === 'string') {
      // note: there is a quirk where some messages don't have a timestamp
      if (isUnread(msg)) {
        store.filter[msg.key] = true
        api.unread.sync.saveStore(store)
        return true
      }
    }
  }
}

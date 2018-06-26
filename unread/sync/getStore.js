var nest = require('depnest')

exports.gives = nest({
  'unread.sync.getStore': true
})

exports.needs = nest({
  'unread.sync.saveStore': 'first'
})

// load current state of unread messages.

exports.create = function (api) {
  var store = null

  return nest({
    'unread.sync.getStore': getStore
  })

  function getStore () {
    if (store) return store

    initializeStore()
    return store
  }

  function initializeStore () {
    if (localStorage.unread) {
      try {
        store = JSON.parse(localStorage.unread)
      } catch (err) {}
    }
    if (!store) { store = {timestamp: Date.now()} }

    store.timestamp = store.timestamp || Date.now()

    if (!store.filter) { store.filter = {} }

    document.body.onunload = () => api.unread.sync.saveStore(store)
  }

  function isUnread (msg) {
    if (msg.timestamp && msg.timestamp < store.timestamp) return false
    return !store.filter[msg.key]
  }

  function markRead (msg) {
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

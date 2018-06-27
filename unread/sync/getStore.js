var nest = require('depnest')

exports.gives = nest({'unread.sync.getStore': true})
exports.needs = nest({'unread.sync.saveStore': 'first'})

exports.create = function (api) {
  var store = null

  return nest({
    'unread.sync.getStore': function getStore () {
      if (store) return store

      initializeStore()
      return store
    }
  })

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
}

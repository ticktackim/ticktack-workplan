var nest = require('depnest')

exports.gives = nest({
  'unread.sync.saveStore': true
})

// load current state of unread messages.

exports.create = function (api) {
  var timer = null

  return nest({
    'unread.sync.saveStore': saveStore
  })

  function saveStore (store) {
    if (timer) return
    if (!store) throw new Error('unread.sync.saveStore expects to be given a store')

    timer = setTimeout(function () {
      timer = null
      localStorage.unread = JSON.stringify(store)
    }, 2e3)
  }
}

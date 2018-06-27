var nest = require('depnest')

exports.gives = nest({'unread.sync.isUnread': true})
exports.needs = nest({'unread.sync.getStore': 'first'})

exports.create = function (api) {
  return nest({
    'unread.sync.isUnread': function isUnread (msg) {
      const store = api.unread.sync.getStore()
      if (msg.timestamp && msg.timestamp < store.timestamp) return false
      return !store.filter[msg.key]
    }
  })
}

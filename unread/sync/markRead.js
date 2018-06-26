var nest = require('depnest')

exports.gives = nest({
  'unread.sync.markRead': true
})

exports.needs = nest({
  'message.sync.getParticipants': 'first',
  'unread.sync.getStore': 'first',
  'unread.sync.isUnread': 'first',
  'unread.sync.saveStore': 'first',
  'unread.obs.getUnreadMsgsCache': 'first'
})

// load current state of unread messages.

exports.create = function (api) {
  return nest({
    'unread.sync.markRead': markRead
  })

  function markRead (msg) {
    const store = api.unread.sync.getStore()
    const { isUnread, saveStore } = api.unread.sync
    const { getUnreadMsgsCache } = api.unread.obs

    getUnreadMsgsCache(msg.value.content.root || msg.key)
      .delete(msg.key)

    const participants = api.message.sync.getParticipants(msg)
    getUnreadMsgsCache(participants.key)
      .delete(msg.key)

    if (msg && typeof msg.key === 'string') {
      // note: there is a quirk where some messages don't have a timestamp
      if (isUnread(msg)) {
        store.filter[msg.key] = true
        saveStore(store)
        return true
      }
    }
  }
}

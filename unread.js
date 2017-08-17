var nest = require('depnest')
var BloomFilter = require('jsbloom').filter

exports.gives = nest({
  'unread.sync.isUnread': true,
  'unread.sync.markRead': true,
})

//load current state of unread messages.

exports.create = function (api) {

  var unread = null
  if(localStorage.unread) {
    try {
      unread = JSON.parse(localStorage.unread)
    } catch (err) {}

    if(!unread) {
      unread = {timestamp: Date.now()}
    }

    if(!unread.filter) {
      unread.filter = new Filter(10000, 0.001)
    }
    else {
      var filter = new BloomFilter(10000, 0.001)
      filter.importData(unread.filter)
      unread.filter = filter
    }
  }

  function isUnread(msg) {
    //ignore messages which do not have timestamps
    if(!msg.timestamp) return false
    if(msg.timestamp < unread.timestamp) return false
    return !unread.filter.checkEntry(msg.key)
  }

  function addRead(msg) {
    unread.filter.addEntry(msg.key)
  }

  document.body.onunload = function () {
    localStorage.unread = JSON.stringify({
      timestamp: unread.timestamp,
      filter: unread.filter.exportData()
    })
  }

  return nest({
    'unread.sync.isUnread': isUnread,
    'unread.sync.markRead': markRead
  })
}

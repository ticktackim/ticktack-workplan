var nest = require('depnest')
//var BloomFilter = require('jsbloom').filter

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
  }
  if(!unread)
    unread = {timestamp: Date.now()}

  unread.timestamp = unread.timestamp || Date.now()

  if(!unread.filter)
    unread.filter = {}

  var timer
  function save () {
    if(timer) return

    timer = setTimeout(function () {
      timer = null
      localStorage.unread = JSON.stringify(unread)
    }, 2e3)
  }

  function isUnread(msg) {
    //ignore messages which do not have timestamps
    if(!msg.timestamp) return false
    if(msg.timestamp < unread.timestamp) return false
    if(unread.filter[msg.key]) {
      return false
    }
      return true
  }

  function markRead(msg) {
    if('string' === typeof msg.key) {
      //if(isUnread(msg)) {
        unread.filter[msg.key] = true
        save()
        return true
      //}
    }
  }

  document.body.onunload = save

  return nest({
    'unread.sync.isUnread': isUnread,
    'unread.sync.markRead': markRead
  })
}


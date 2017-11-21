var nest = require('depnest')
var { Dict, Set } = require('mutant')

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
      console.log('save!', Object.keys(unread.filter).length)
      localStorage.unread = JSON.stringify(unread)
    }, 2e3)
  }

  function isUnread(msg) {
    if(msg.timestamp && msg.timestamp < unread.timestamp) return false
    return !unread.filter[msg.key]
  }

  function markRead(msg) {
    if(msg && 'string' === typeof msg.key) {
      //note: there is a quirk where some messages don't have a timestamp
      if(isUnread(msg)) {
        var userUser 
        unread.filter[msg.key] = true
        save()
        return true
      }
    }
  }

  document.body.onunload = save

  return nest({
    'unread.sync.isUnread': isUnread,
    'unread.sync.markRead': markRead,
  })
}


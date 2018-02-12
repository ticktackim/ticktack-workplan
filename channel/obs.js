const nest = require('depnest')
const ref = require('ssb-ref')
const computed = require('mutant/computed')

exports.needs = nest({
  'keys.sync.id': 'first',
  'channel.obs.subscribed': 'first',
})

exports.gives = nest('channel.obs.isSubscribedTo')

exports.create = function (api) {
  var subscriptions = {}
  var myId

  return nest('channel.obs.isSubscribedTo', isSubscribedTo)

  function isSubscribedTo (channel, id) {
    if (!ref.isFeed(id)) {
      id = getMyId()
    }
        
    return computed(getSubscriptions(id), (v) => v.has(channel))
  }

  //cache getters

  function getMyId () {
    if (!myId) myId = api.keys.sync.id()
    return myId
  }

  function getSubscriptions (id) {
    if (!subscriptions[id]) subscriptions[id] = api.channel.obs.subscribed(id)
    return subscriptions[id]
  }
}


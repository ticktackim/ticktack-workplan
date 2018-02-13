const nest = require('depnest')
const ref = require('ssb-ref')
const { computed, onceTrue } = require('mutant')

exports.needs = nest({
  'keys.sync.id': 'first',
  'channel.obs.subscribed': 'first',
  'sbot.obs.connection': 'first'
})

exports.gives = nest('channel.obs.isSubscribedTo')

exports.create = function (api) {
  var subscriptions = {}
  var myId

  return nest('channel.obs.isSubscribedTo', isSubscribedTo)

  function isSubscribedTo (channel, id) {
    channel = channel.replace(/^#/, '')
    if (!ref.isFeed(id)) {
      id = getMyId()
    }

    // TODO - use ssb-server-channel index to make a better subscribed obs
    return computed(getSubscriptions(id), set => {
      return set.has(channel)
    })
  }

  // cache getters

  function getMyId () {
    if (!myId) myId = api.keys.sync.id()
    return myId
  }

  function getSubscriptions (id) {
    if (subscriptions[id] === undefined) subscriptions[id] = api.channel.obs.subscribed(id)
    return subscriptions[id]
  }
}

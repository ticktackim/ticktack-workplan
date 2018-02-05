const nest = require('depnest')
const ref = require('ssb-ref')
const computed = require('mutant/computed')

exports.needs = nest({
  'keys.sync.id': 'first',
  'channel.obs.subscribed': 'first',
})

exports.gives = nest('channel.obs.isSubscribedTo')

exports.create = function (api) {
  return nest('channel.obs.isSubscribedTo', isSubscribedTo)

  function isSubscribedTo (channel, id) {
    if (!ref.isFeed(id)) {
      id = api.keys.sync.id()
    }
        
    const { subscribed } = api.channel.obs
    const myChannels = subscribed(id)
    return computed([myChannels], (v) => [...v].includes(channel))
  }
}

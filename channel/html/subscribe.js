const nest = require('depnest')
const { h, when } = require('mutant')

exports.gives = nest('channel.html.subscribe')

exports.needs = nest({
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first',
  'channel.obs.isSubscribedTo': 'first',
  'channel.async.subscribe': 'first',
  'channel.async.unsubscribe': 'first',
})

exports.create = function (api) {
    
  return nest('channel.html.subscribe', (channel) => {
    const strings = api.translations.sync.strings()
    const myId = api.keys.sync.id()
    const { subscribe, unsubscribe } = api.channel.async
    
    return when(api.channel.obs.isSubscribedTo(channel, myId),
      h('Button', { 'ev-click': () => unsubscribe(channel) }, strings.channelShow.action.unsubscribe),
      h('Button -primary', { 'ev-click': () => subscribe(channel) }, strings.channelShow.action.subscribe)
    )
  })
}


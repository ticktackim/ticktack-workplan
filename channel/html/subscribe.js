const nest = require('depnest')
const { h, when } = require('mutant')

exports.gives = nest('channel.html.subscribe')

exports.needs = nest({
  'translations.sync.strings': 'first',
  'channel.obs.isSubscribedTo': 'first',
  'channel.async.subscribe': 'first',
  'channel.async.unsubscribe': 'first',
})

exports.create = function (api) {
    
  return nest('channel.html.subscribe', (channel) => {
    channel = channel.replace(/^#/, '')
    const strings = api.translations.sync.strings()
    const { subscribe, unsubscribe } = api.channel.async
    const isSubscribed = api.channel.obs.isSubscribedTo(channel)

    isSubscribed(val => {
      console.log(channel, 'subscribed:', val)
    })

    return when(isSubscribed,
      h('Button', { 'ev-click': () => unsubscribe(channel) }, strings.channelShow.action.unsubscribe),
      h('Button -primary', { 'ev-click': () => subscribe(channel) }, strings.channelShow.action.subscribe)
    )
  })
}


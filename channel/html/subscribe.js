const nest = require('depnest')
const { h, when } = require('mutant')

exports.gives = nest('channel.html.subscribe')

exports.needs = nest({
  'app.obs.pluginsOk': 'first',
  'translations.sync.strings': 'first',
  'channel.obs.isSubscribedTo': 'first',
  'channel.async.subscribe': 'first',
  'channel.async.unsubscribe': 'first'
})

exports.create = function (api) {
  return nest('channel.html.subscribe', (channel) => {
    channel = channel.replace(/^#/, '')
    const strings = api.translations.sync.strings()
    const { subscribe, unsubscribe } = api.channel.async

    when(api.app.obs.pluginsOk(),
      when(api.channel.obs.isSubscribedTo(channel),
        h('Button', { 'ev-click': () => unsubscribe(channel) }, strings.channelShow.action.unsubscribe),
        h('Button -primary', { 'ev-click': () => subscribe(channel) }, strings.channelShow.action.subscribe)
      )
    )
  })
}

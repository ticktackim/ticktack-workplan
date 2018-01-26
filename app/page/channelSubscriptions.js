const nest = require('depnest')
const { h, watch } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.page.channelSubscriptions')

exports.needs = nest({
  'app.html.sideNav': 'first',
  'app.html.topNav': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'channel.obs.subscribed': 'first',
  'channel.html.link': 'first',
  'app.html.channelCard': 'first',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest('app.page.channelSubscriptions', function (location) {
    const strings = api.translations.sync.strings()
    const myId = api.keys.sync.id()
    
    const { subscribed } = api.channel.obs
    const myChannels = subscribed(myId)
    
    return h('Page -channelSubscriptions', {title: strings.home}, [
      api.app.html.sideNav(location),
      h('div.content',[ 
        //api.app.html.topNav(location),
        [...myChannels().values()].map(c => api.app.html.channelCard(c))
      ])
    ])
  })
}





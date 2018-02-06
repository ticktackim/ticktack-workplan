const nest = require('depnest')
const { h, when } = require('mutant')


exports.gives = nest('app.html.channelCard')

exports.needs = nest({
    'keys.sync.id': 'first',
    'history.sync.push': 'first',
    'translations.sync.strings': 'first',
    'channel.obs.subscribed': 'first',
    'channel.async.subscribe': 'first',
    'channel.async.unsubscribe': 'first',
    'channel.obs.isSubscribedTo': 'first',
})

exports.create = function (api) {
    
    return nest('app.html.channelCard', (channel) => {
        const strings = api.translations.sync.strings()
        const myId = api.keys.sync.id()
        const { subscribe, unsubscribe } = api.channel.async
        const { isSubscribedTo } = api.channel.obs
        const youSubscribe = isSubscribedTo(channel, myId)
        
        const goToChannel = () => {
            api.history.sync.push({ page: 'channelShow', channel: channel })
        }
        
        return h('ChannelCard', [
            h('div.content', [
                h('div.text', [
                    h('h2', {'ev-click': goToChannel}, channel),
                    when(youSubscribe,
                        h('Button', { 'ev-click': () => unsubscribe(channel) }, strings.channelShow.action.unsubscribe),
                        h('Button', { 'ev-click': () => subscribe(channel) }, strings.channelShow.action.subscribe)
                    ),
                ])
            ])
        ])
    })
}


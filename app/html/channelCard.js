var nest = require('depnest')
const { h, map, when, Value } = require('mutant')
var isString= require('lodash/isString')
var maxBy= require('lodash/maxBy')
var markdown = require('ssb-markdown')
var ref = require('ssb-ref')
var htmlEscape = require('html-escape')

exports.gives = nest('app.html.channelCard')

exports.needs = nest({
    'keys.sync.id': 'first',
    'history.sync.push': 'first',
    'translations.sync.strings': 'first',
    'channel.obs.subscribed': 'first',
    'channel.async.subscribe': 'first',
    'channel.async.unsubscribe': 'first',
    'channel.sync.isSubscribedTo': 'first',
})

exports.create = function (api) {
    
    return nest('app.html.channelCard', (channel) => {
        var strings = api.translations.sync.strings()

        const myId = api.keys.sync.id()
        const { subscribed } = api.channel.obs
        const { subscribe, unsubscribe } = api.channel.async
        const { isSubscribedTo } = api.channel.sync
        const myChannels = subscribed(myId)
        let cs = myChannels().values()
        const youSubscribe = Value(isSubscribedTo(channel, myId))

        let cb = () => {
            youSubscribe.set(isSubscribedTo(channel, myId))
        }
        
        const goToChannel = (e, channel) => {
            e.stopPropagation()
            
            api.history.sync.push({ page: 'channelShow', channel: channel })
        }
        
        var b = h('ChannelCard', [
            h('div.content', [
                h('div.text', [
                    h('h2', {'ev-click': ev => goToChannel(ev, channel)}, channel),
                    when(youSubscribe,
                        h('Button', { 'ev-click': () => unsubscribe(channel, cb) }, strings.channelShow.action.unsubscribe),
                        h('Button', { 'ev-click': () => subscribe(channel, cb) }, strings.channelShow.action.subscribe)
                    ),
                ])
            ])
        ])
        
        return b
    })
}


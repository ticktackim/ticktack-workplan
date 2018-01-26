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
    'channel.async.isSubscribed': 'first',
})

exports.create = function (api) {
    
    return nest('app.html.channelCard', (channel) => {
        var strings = api.translations.sync.strings()

        const myId = api.keys.sync.id()
        const { subscribed } = api.channel.obs
        const { subscribe, unsubscribe, isSubscribed } = api.channel.async
        const myChannels = subscribed(myId)
        let cs = myChannels().values()
        const youSubscribe = Value(isSubscribed(channel))

        let cb = () => {
            youSubscribe.set(isSubscribed(channel))
        }
        
        const goToChannel = (e, channel) => {
            e.stopPropagation()
            
            api.history.sync.push({ page: 'blogSearch', channel })
        }
        
        var b = h('ChannelCard', [
            h('div.content', [
                h('div.text', [
                    h('h2', {'ev-click': ev => goToChannel(ev, channel)}, channel),
                    when(youSubscribe,
                        h('Button', { 'ev-click': () => unsubscribe(channel, cb) }, "Unsubscribe"),
                        h('Button', { 'ev-click': () => subscribe(channel, cb) }, "Subscribe")
                    ),
                ])
            ])
        ])
        
        return b
    })
}


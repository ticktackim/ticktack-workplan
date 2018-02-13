const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.html.channelCard')

exports.needs = nest({
  'history.sync.push': 'first',
  'channel.html.subscribe': 'first'
})

exports.create = function (api) {
  return nest('app.html.channelCard', (channel) => {
    const goToChannel = () => {
      api.history.sync.push({ page: 'channelShow', channel: channel })
    }

    return h('ChannelCard', [
      h('div.content', [
        h('div.text', [
          h('h2', {'ev-click': goToChannel}, channel),
          api.channel.html.subscribe(channel)
        ])
      ])
    ])
  })
}

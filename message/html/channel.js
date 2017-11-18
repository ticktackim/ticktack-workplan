const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('message.html.channel')

exports.needs = nest({
  'history.sync.push': 'first'
})

exports.create = function (api) {
  return nest('message.html.channel', channel)

  function channel (msg) {
    const { channel } = msg.value.content

    if (!channel) return

    return h('Button -channel', {
      // 'ev-click': () => history.sync.push({ page: 'channelIndex', channel }) // TODO
    }, channel)
  }
}



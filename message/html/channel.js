const nest = require('depnest')
const { h, resolve } = require('mutant')

exports.gives = nest('message.html.channel')

exports.needs = nest({
  'history.sync.push': 'first'
})

exports.create = function (api) {
  return nest('message.html.channel', channel)

  function channel (msgOrChannel, opts = {} ) {
    const channel = typeof msgOrChannel === 'string'
      ? msgOrChannel
      : msgOrChannel.value.content.channel

    if (!channel) return

    const { 
      classList = [],
      location = { page: 'blogSearch', channel }
    } = opts

    const goToChannel = (e) => {
      e.stopPropagation()

      api.history.sync.push(location)
    }

    return h('Button -channel', {
      'ev-click': goToChannel,
      classList
    }, '#' + channel)
  }
}



const nest = require('depnest')
const { h, onceTrue } = require('mutant')
const defer = require('pull-defer')

exports.gives = nest('app.page.notifications')

exports.needs = nest({
  'app.html.scroller': 'first',
  'app.html.sideNav': 'first',
  'message.html.comment': 'first',
  'message.html.notification': 'first',
  'sbot.obs.connection': 'first',
  'translations.sync.strings': 'first'
})

const SOURCES = {
  comments: 'readAllComments',
  likes: 'readAllLikes',
  shares: 'readAllShares'
}

exports.create = (api) => {
  return nest('app.page.notifications', function (location) {
    // location here can expected to be: { page: 'notifications', section: * }
    if (!Object.keys(SOURCES).includes(location.section)) return

    var scroller = api.app.html.scroller({
      classList: ['content'],
      createStream: createCreateStream(location.section),
      render: createRender(location.section)
    })

    return h('Page -notifications', [
      api.app.html.sideNav(location),
      scroller
    ])

    function createCreateStream (section) {
      return function (opts) {
        // TODO - refactor with sbot.pull.stream
        const source = defer.source()
        var resolved = false

        onceTrue(api.sbot.obs.connection, server => {
          if (resolved) return

          source.resolve(server.ticktack[SOURCES[section]](opts))
          resolved = true
        })

        return source
      }
    }

    function createRender (section) {
      return function (msg) {
        switch (section) {
          case 'comments':
            return api.message.html.comment({ comment: msg, showRootLink: true })

          case 'likes':
            return api.message.html.notification(msg)

          case 'shares':
            return api.message.html.notification(msg)
        }
      }
    }
  })
}

const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.notifications')

exports.needs = nest({
  'app.html.scroller': 'first',
  'app.html.sideNav': 'first',
  'message.html.comment': 'first',
  'message.html.notification': 'first',
  'sbot.pull.stream': 'first',
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

    const createStream = (opts) => api.sbot.pull.stream(server => {
      const source = SOURCES[location.section]
      return server.ticktack[source](opts)
    })

    var scroller = api.app.html.scroller({
      classList: ['content'],
      createStream,
      render: createRender(location.section)
    })

    return h('Page -notifications', [
      api.app.html.sideNav(location),
      scroller
    ])

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

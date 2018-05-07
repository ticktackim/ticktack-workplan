const nest = require('depnest')
const { h, onceTrue } = require('mutant')
const defer = require('pull-defer')

exports.gives = nest('app.page.notifications')

exports.needs = nest({
  'app.html.scroller': 'first',
  'app.html.sideNav': 'first',
  'message.html.comment': 'first',
  'sbot.obs.connection': 'first',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest('app.page.notifications', function (location) {
    // location here can expected to be: { page: 'notifications', section: * }

    var scroller = api.app.html.scroller({
      classList: ['content'],
      stream: createBlogCommentStream,
      render: Comment
    })

    function createBlogCommentStream (opts) {
      const source = defer.source()
      var resolved = false

      onceTrue(api.sbot.obs.connection, server => {
        if (resolved) return

        source.resolve(server.blogStats.readAllComments(opts))
        resolved = true
      })

      return source
    }

    return h('Page -notifications', [
      api.app.html.sideNav(location),
      scroller
    ])

    function Comment (msg) {
      return api.message.html.comment({ comment: msg, showRootLink: true })
    }
  })
}

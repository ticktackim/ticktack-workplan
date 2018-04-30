const nest = require('depnest')
const { h, onceTrue, throttle, Value, Array: MutantArray, map, resolve } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.page.notifications')

exports.needs = nest({
  // 'app.html.blogCard': 'first',
  // 'app.html.topNav': 'first',
  // 'app.html.scroller': 'first',
  'app.html.sideNav': 'first',
  // 'blog.sync.isBlog': 'first',
  // 'feed.pull.public': 'first',
  // 'feed.pull.type': 'first',
  // 'history.sync.push': 'first',
  // 'keys.sync.id': 'first',
  // 'message.sync.isBlocked': 'first',
  'sbot.obs.connection': 'first',
  'translations.sync.strings': 'first'
  // 'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  // var blogsCache = MutantArray()

  return nest('app.page.notifications', function (location) {
    // location here can expected to be: { page: 'notifications'}

    var strings = api.translations.sync.strings()

    var commentsStore = MutantArray([])

    onceTrue(api.sbot.obs.connection, server => {
      console.log('methods', server.blogStats)
      pull(
        server.blogStats.readAllComments(),
        pull.drain(m => {
          commentsStore.push(m)
        })
      )
    })

      // server.blogStats.getBlogs({ keys: true, values: false }, (err, data) => {
        // if (err) throw err

        // const blogIds = data.map(d => d[1])

        // var source = server.blogStats.read({
        //   // live: true,
        //   gte: [ 'C', undefined, undefined ],
        //   lte: [ 'C~', null, null ],
        //   reverse: true,
        //   values: true,
        //   keys: true,
        //   seqs: false
        // })
        // console.log(blogIds)

        // pull(
        //   source,
        //   pull.filter(result => {
        //     return blogIds.includes(result.key[1])
        //   }),
        //   pull.map(result => result.value),
        //   pull.drain(m => {
        //     commentsStore.push(m)
        //   })
        // )
      // })
    // })

    // var blogs = api.app.html.scroller({
    //   classList: ['content'],
    //   prepend: api.app.html.topNav(location),
    //   // stream: api.feed.pull.public,
    //   stream: api.feed.pull.type('blog'),
    //   filter: () => pull(
    //     // pull.filter(api.blog.sync.isBlog),
    //     pull.filter(msg => !msg.value.content.root), // show only root messages
    //     pull.filter(msg => !api.message.sync.isBlocked(msg))
    //   ),
    //   // FUTURE : if we need better perf, we can add a persistent cache. At the moment this page is fast enough though.
    //   // See implementation of app.html.sideNav for example
    //   store: blogsCache,
    //   updateTop: update,
    //   updateBottom: update,
    //   render
    // })

    return h('Page -notifications', [
      api.app.html.sideNav(location),
      h('div.content', map(throttle(commentsStore, 300), comment => {
        const text = comment.value.content.text

        return h('p', { style: { margin: '1rem' } }, text)
      }))
    ])
  })

/*   function update (soFar, newBlog) { */
//     soFar.transaction(() => {
//       const { timestamp } = newBlog.value

//       var object = newBlog // Value(newBlog)

//       const index = indexOf(soFar, (blog) => newBlog.key === resolve(blog).key)
//       // if blog already in cache, not needed again
//       if (index >= 0) return

//       // Orders by: time received
//       const justOlderPosition = indexOf(soFar, (msg) => newBlog.timestamp > resolve(msg).timestamp)

//       // Orders by: time published BUT the messagesByType stream streams _by time received_
//       // TODO - we need an index of all blogs otherwise the scroller doesn't work...
//       // const justOlderPosition = indexOf(soFar, (msg) => timestamp > resolve(msg).value.timestamp)

//       if (justOlderPosition > -1) {
//         soFar.insert(object, justOlderPosition)
//       } else {
//         soFar.push(object)
//       }
//     })
//   }

//   function render (blog) {
//     const { recps, channel } = blog.value.content
//     var onClick
//     if (channel && !recps) { onClick = (ev) => api.history.sync.push(Object.assign({}, blog, { page: 'blogShow' })) }
//     return api.app.html.blogCard(blog, { onClick })
//   }
// }

// function indexOf (array, fn) {
//   for (var i = 0; i < array.getLength(); i++) {
//     if (fn(array.get(i))) {
//       return i
//     }
//   }
//   return -1
}

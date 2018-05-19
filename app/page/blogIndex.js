const nest = require('depnest')
const { h, Value, Array: MutantArray, resolve } = require('mutant')
const Scroller = require('mutant-scroll')
const pull = require('pull-stream')
const Next = require('pull-next')

exports.gives = nest('app.page.blogIndex')

exports.needs = nest({
  'app.html.blogCard': 'first',
  'app.html.topNav': 'first',
  // 'app.html.scroller': 'first',
  'app.html.sideNav': 'first',
  'blog.sync.isBlog': 'first',
  'feed.pull.public': 'first',
  'feed.pull.type': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'message.sync.isBlocked': 'first',
  'translations.sync.strings': 'first',
  'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  var blogsCache = MutantArray()

  return nest('app.page.blogIndex', function (location) {
    // location here can expected to be: { page: 'blogIndex'}

    var strings = api.translations.sync.strings()

    // const filter = () => pull(
      // pull.filter(api.blog.sync.isBlog), // isBlog or Plog?
      // pull.filter(msg => !msg.value.content.root), // show only root messages
      // pull.filter(msg => !api.message.sync.isBlocked(msg)) // this is already in feed.pull.type
    // )

    // stream: api.feed.pull.public, // for post + blog type

    const streamToTop = pull(
      // next(stream, { live: true, reverse: false, old: false, limit: 100, property: indexProperty }),
      api.feed.pull.type('blog')({ live: true, reverse: false, old: false }),
      // filter()
    )

    
    const streamToBottom = pull(
      Next
      api.feed.pull.type('blog')({ live: false, reverse: true }),
      // filter()

    )

    var blogs = Scroller({
      classList: ['content'],
      prepend: api.app.html.topNav(location),
      streamToTop,
      streamToBottom,
      updateTop: update,
      updateBottom: update,
      store: blogsCache,
      render
    })

    return h('Page -blogIndex', {title: strings.home}, [
      api.app.html.sideNav(location),
      blogs
    ])
  })

  function update (soFar, newBlog) {
    soFar.transaction(() => {
      var object = newBlog // Value(newBlog)

      const index = indexOf(soFar, (blog) => newBlog.key === resolve(blog).key)
      // if blog already in cache, not needed again
      if (index >= 0) return

      // Orders by: time received
      const justOlderPosition = indexOf(soFar, (msg) => newBlog.timestamp > resolve(msg).timestamp)

      // Orders by: time published BUT the messagesByType stream streams _by time received_
      // TODO - we need an index of all blogs otherwise the scroller doesn't work...
      // const justOlderPosition = indexOf(soFar, (msg) => newBlog.value.timestamp > resolve(msg).value.timestamp)

      if (justOlderPosition > -1) {
        soFar.insert(object, justOlderPosition)
      } else {
        soFar.push(object)
      }
    })
  }

  function render (blog) {
    const { recps, channel } = blog.value.content
    var onClick
    if (channel && !recps) { onClick = (ev) => api.history.sync.push(Object.assign({}, blog, { page: 'blogShow' })) }
    return api.app.html.blogCard(blog, { onClick })
  }
}

function indexOf (array, fn) {
  for (var i = 0; i < array.getLength(); i++) {
    if (fn(array.get(i))) {
      return i
    }
  }
  return -1
}

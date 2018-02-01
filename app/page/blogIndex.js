const nest = require('depnest')
const { h, Value, resolve } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.page.blogIndex')

exports.needs = nest({
  'app.html.blogCard': 'first',
  'app.html.topNav': 'first',
  'app.html.scroller': 'first',
  'app.html.sideNav': 'first',
  'feed.pull.public': 'first',
  'feed.pull.type': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'message.sync.isBlocked': 'first',
  'translations.sync.strings': 'first',
  'unread.sync.isUnread': 'first'
})

// TODO extract to  global location
const BLOG_TYPES = [
  'blog',
  // 'post'
]

exports.create = (api) => {
  return nest('app.page.blogIndex', function (location) {
    // location here can expected to be: { page: 'blogIndex'}
 
    var strings = api.translations.sync.strings()

    var blogs = api.app.html.scroller({
      classList: ['content'],
      prepend: api.app.html.topNav(location),
      stream: api.feed.pull.type('blog'), // this delivers things in an odd order D:
      indexProperty: ['value', 'timestamp'],
      // stream: api.feed.pull.public, 
      filter: () => pull(
        pull.filter(isRoot),
        // pull.filter(isBlog), // don't need this if using feed.pull.type,
        pull.filter(msg => !api.message.sync.isBlocked(msg))
      ),
      // FUTURE : if we need better perf, we can add a persistent cache. At the moment this page is fast enough though.
      // See implementation of app.html.sideNav for example
      // store: recentMsgCache,
      // updateTop: update,
      // updateBottom: update,
      render
    })

    return h('Page -blogIndex', {title: strings.home}, [
      api.app.html.sideNav(location),
      blogs
    ])
  })


  function update (soFar, newBlog) {
    soFar.transaction(() => { 
      const { timestamp } = newBlog.value

      var object = newBlog // Value(newBlog)
      
      // Orders by: time received
      const justOlderPosition = indexOf(soFar, (msg) => newBlog.timestamp > resolve(msg).timestamp)

      // Orders by: time published BUT the messagesByType stream streams _by time received_ ??
      // TODO - we need an index of all blogs otherwise the scroller doesn't work...
      // const justOlderPosition = indexOf(soFar, (msg) => timestamp > resolve(msg).value.timestamp)

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
    if (channel && !recps)
      onClick = (ev) => api.history.sync.push(Object.assign({}, blog, { page: 'blogShow' }))
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

function isRoot (msg) {
  return !msg.value.content.root
}

// TODO extract this
function isBlog (msg) {
  const type = msg.value.content.type
  return BLOG_TYPES.includes(type)
}


const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.page.blogSearch')

exports.needs = nest({
  'app.html.context': 'first',
  'app.html.blogCard': 'first',
  'app.html.blogHeader': 'first',
  'app.html.scroller': 'first',
  'feed.pull.public': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first',
  'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  return nest('app.page.blogSearch', blogSearch)
  
  function blogSearch (location) {
    // location here can expected to be: { page: 'blogSearch'}
 
    var strings = api.translations.sync.strings()

    var blogs = api.app.html.scroller({
      classList: ['content'],
      prepend: api.app.html.blogHeader(location),
      stream: api.feed.pull.public,
      filter: () => pull(
        pull.filter(msg => {
          const type = msg.value.content.type
          return type === 'post' || type === 'blog'
        }),
        pull.filter(msg => !msg.value.content.root) // show only root messages
      ),
      // FUTURE : if we need better perf, we can add a persistent cache. At the moment this page is fast enough though.
      // See implementation of app.html.context for example
      // store: recentMsgCache,
      // updateTop: updateRecentMsgCache,
      // updateBottom: updateRecentMsgCache,
      render
    })

    return h('Page -blogSearch', {title: strings.home}, [
      api.app.html.context(location),
      blogs
    ])
  }


  function render (blog) {
    const { recps, channel } = blog.value.content
    var onClick
    if (channel && !recps)
      onClick = (ev) => api.history.sync.push(Object.assign({}, blog, { page: 'blogShow' }))

    return api.app.html.blogCard(blog, { onClick })
  }
}



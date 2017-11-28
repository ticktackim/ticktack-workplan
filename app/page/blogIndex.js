const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.page.blogIndex')

exports.needs = nest({
  'app.html.context': 'first',
  'app.html.blogCard': 'first',
  'app.html.scroller': 'first',
  'feed.pull.public': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first',
  'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  return nest('app.page.blogIndex', function (location) {
    // location here can expected to be: { page: 'blogIndex'} or { page: 'home' }
 
    var strings = api.translations.sync.strings()

    var blogs = api.app.html.scroller({
      classList: ['content'],
      prepend: h('Button -primary', { 'ev-click': () => api.history.sync.push({ page: 'blogNew' }) }, strings.blogNew.actions.writeBlog),
      stream: api.feed.pull.public,
      filter: () => pull(
        pull.filter(msg => {
          const type = msg.value.content.type
          return type === 'post' || type === 'blog'
        })
      ),
      render
    })

    return h('Page -blogIndex', {title: strings.home}, [
      api.app.html.context(location),
      blogs
    ])
  })



  function render (blog) {
    const { recps, channel } = blog.value.content
    var onClick
    if (channel && !recps)
      onClick = (ev) => api.history.sync.push(Object.assign({}, blog, { page: 'blogShow' }))

    return api.app.html.blogCard(blog, { onClick })
  }
}


const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.blogShow')

exports.needs = nest({
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'app.html.topNav': 'first',
  'app.html.comments': 'first',
  'app.html.sideNav': 'first',
  'contact.html.follow': 'first',
  'message.html.channel': 'first',
  'message.html.likes': 'first',
  'message.html.webshares': 'first',
  'message.html.shares': 'first',
  'message.html.timeago': 'first',
  'feed.obs.thread': 'first',
  'blog.html.title': 'first',
  'blog.html.content': 'first'
})

exports.create = (api) => {
  return nest('app.page.blogShow', blogShow)

  function blogShow(blogMsg) {
    // blogMsg = a thread (message, may be decorated with replies)

    const { author } = blogMsg.value

    const blog = api.blog.html.content(blogMsg)
    const title = api.blog.html.title(blogMsg)

    const thread = api.feed.obs.thread(blogMsg.key)
    const comments = api.app.html.comments(thread)

    const { timeago, channel } = api.message.html

    return h('Page -blogShow', [
      api.app.html.sideNav({ page: 'blogShow' }), // HACK to highlight discover
      h('Scroller.content', [
        h('section.top', [
          api.app.html.topNav(blogMsg)
        ]),
        h('section.content', [
          h('header', [
            h('div.blog-details', [
              h('h1', title),
              timeago(blogMsg),
              channel(blogMsg),
              api.message.html.likes(blogMsg),
              api.message.html.shares(blogMsg),
              api.message.html.webshares(blogMsg)
            ]),
            h('div.author', [
              h('div.leftCol', api.about.html.avatar(author, 'medium')),
              h('div.rightCol', [
                h('div.name', api.about.obs.name(author)),
                api.contact.html.follow(author)
              ])
            ])
          ]),
          h('div.break', h('hr')),
          h('section.blog', blog),
          comments
        ])
      ])
    ])
  }
}

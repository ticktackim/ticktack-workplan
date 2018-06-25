const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.page.channelShow')

exports.needs = nest({
  'app.html.sideNav': 'first',
  'app.html.topNav': 'first',
  'app.html.scroller': 'first',
  'app.html.blogCard': 'first',
  'blog.sync.isBlog': 'first',
  'channel.html.subscribe': 'first',
  'feed.pull.channel': 'first',
  'history.sync.push': 'first',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest('app.page.channelShow', channelShow)

  function channelShow (location) {
    const strings = api.translations.sync.strings()
    const { channel } = location

    const prepend = [
      api.app.html.topNav(location),
      h('section.about', [
        h('h1', channel),
        h('div.actions', [
          api.channel.html.subscribe(channel)
        ])
      ])
    ]

    var channelPosts = api.app.html.scroller({
      classList: ['content'],
      prepend,
      createStream: api.feed.pull.channel(channel),
      filter: () => pull(
        pull.filter(api.blog.sync.isBlog),
        pull.filter(msg => !msg.value.content.root) // show only root messages
      ),
      // FUTURE : if we need better perf, we can add a persistent cache. At the moment this page is fast enough though.
      // See implementation of app.html.sideNav for example
      // store: recentMsgCache,
      // updateTop: updateRecentMsgCache,
      // updateBottom: updateRecentMsgCache,
      render
    })

    location.page = location.page || 'channelShow'
    // covers case where router.sync.normalise delivers a loc = { channel: '#channelName' }
    // HACK: helps sideNav

    return h('Page -channelShow', { title: strings.home }, [
      api.app.html.sideNav(location),
      channelPosts
    ])
  }

  function render (blog) {
    const { recps, channel } = blog.value.content
    var onClick
    if (channel && !recps) { onClick = (ev) => api.history.sync.push(Object.assign({}, blog, { page: 'blogShow' })) }

    return api.app.html.blogCard(blog, { onClick })
  }
}

const nest = require('depnest')
const { h, Value, computed, map, when, resolve } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.page.channelShow')

exports.needs = nest({
  'app.html.sideNav': 'first',
  'app.html.topNav': 'first',
  'app.html.scroller': 'first',
  'app.html.blogCard': 'first',
  'channel.obs.recent': 'first',
  'feed.pull.channel': 'first',
  'feed.pull.public': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'message.html.channel': 'first',
  'translations.sync.strings': 'first',
  'unread.sync.isUnread': 'first',
  'channel.obs.subscribed': 'first',
  'channel.async.subscribe': 'first',
  'channel.async.unsubscribe': 'first',
  'channel.sync.isSubscribedTo': 'first'
})

exports.create = (api) => {
  return nest('app.page.channelShow', channelShow)

  function channelShow(location) {
    
    var strings = api.translations.sync.strings()
    const myId = api.keys.sync.id()
    const { subscribed } = api.channel.obs
    const { subscribe, unsubscribe } = api.channel.async
    const { isSubscribedTo } = api.channel.sync
    const myChannels = subscribed(myId)
    let cs = myChannels().values()
    const youSubscribe = Value(isSubscribedTo(location.channel, myId))

    let cb = () => {
      youSubscribe.set(isSubscribedTo(location.channel, myId))
    }

    var searchVal = resolve(location.channel)
    var searchResults = computed([api.channel.obs.recent(), searchVal], (channels, val) => {
      if (val.length < 2) return []

      return channels.filter(c => c.toLowerCase().indexOf(val.toLowerCase()) > -1)
    })
  

    
    createStream = api.feed.pull.channel(location.channel)
    

    const prepend = [
      api.app.html.topNav(location),
      h('section.about', [
        h('h1', location.channel),
        h('div.actions', [
          when(youSubscribe,
            h('Button', { 'ev-click': () => subscribe(location.channel, cb) }, strings.channelShow.action.unsubscribe),
            h('Button', { 'ev-click': () => unsubscribe(location.channel, cb) }, strings.channelShow.action.subscribe)
          )
        ])
      ]),
    ]

    var channelPosts = api.app.html.scroller({
      classList: ['content'],
      prepend,
      stream: createStream,
      filter: () => pull(
        pull.filter(msg => {
          const type = msg.value.content.type
          return type === 'post' || type === 'blog'
        }),
        pull.filter(msg => !msg.value.content.root) // show only root messages
      ),
      // FUTURE : if we need better perf, we can add a persistent cache. At the moment this page is fast enough though.
      // See implementation of app.html.sideNav for example
      // store: recentMsgCache,
      // updateTop: updateRecentMsgCache,
      // updateBottom: updateRecentMsgCache,
      render
    })

    return h('Page -channelShow', { title: strings.home }, [
      api.app.html.sideNav(location),
      channelPosts
    ])
  }


  function render(blog) {
    const { recps, channel } = blog.value.content
    var onClick
    if (channel && !recps)
      onClick = (ev) => api.history.sync.push(Object.assign({}, blog, { page: 'blogShow' }))

    return api.app.html.blogCard(blog, { onClick })
  }
}



const nest = require('depnest')
const { h, Value, computed, map, when, resolve } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.page.blogSearch')

exports.needs = nest({
  'app.html.context': 'first',
  'app.html.blogCard': 'first',
  'app.html.blogNav': 'first',
  'app.html.scroller': 'first',
  'channel.obs.recent': 'first',
  'feed.pull.channel': 'first',
  'feed.pull.public': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'message.html.channel': 'first',
  'translations.sync.strings': 'first',
  'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  return nest('app.page.blogSearch', blogSearch)
  
  function blogSearch (location) {
    // location here can expected to be: { page: 'blogSearch'}
    // OR { page: 'blogSearch', channel: 'scuttlebutt', searchVal: 'scutt'}
 
    var strings = api.translations.sync.strings()

    var searchVal = Value(resolve(location.searchVal) || resolve(location.channel) || '')
    var searchResults = computed([api.channel.obs.recent(), searchVal],  (channels, val) => {
      if (val.length < 2) return []

      return channels.filter(c => c.toLowerCase().indexOf(val.toLowerCase()) > -1)
    })
    var searchField = h('div.search', [
      h('div.input', [
        h('i.fa.fa-search'),
        h('input', { 
          'ev-input': e => searchVal.set(e.target.value),
          value: searchVal 
        })
      ]),
      when(searchResults, 
        h('div.results', map(searchResults, channel => { 
          const classList = channel === location.channel
            ? ['-channelActive']
            : ''
          const newLocation = {
            page: 'blogSearch',
            channel,
            searchVal
          }
          return api.message.html.channel(channel, { classList, location: newLocation })
        }))
      )
    ])

    var createStream = api.feed.pull.public
    if (location.channel) createStream = api.feed.pull.channel(location.channel)

    var blogs = api.app.html.scroller({
      classList: ['content'],
      prepend: [
        api.app.html.blogNav(location),
        searchField
      ],
      stream: createStream,
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



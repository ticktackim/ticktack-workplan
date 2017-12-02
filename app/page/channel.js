const nest = require('depnest')
const { h, computed } = require('mutant')
const More = require('hypermore')
const morphdom = require('morphdom')
const get = require('lodash/get')

exports.gives = nest('app.page.channel')

exports.needs = nest({
  'app.html.link': 'first',
  'app.html.blogCard': 'first',
  'history.sync.push': 'first',
  'state.obs.channel': 'first',
  'translations.sync.strings': 'first',
})

function latestUpdate(thread) {
  var m = thread.timestamp
  if(!thread.replies) return m

  for(var i = 0; i < thread.replies.length; i++)
    m = Math.max(thread.replies[i].timestamp, m)
  return m
}

exports.create = (api) => {
  return nest('app.page.channel', function (location) {
    const { channel } = location
    var strings = api.translations.sync.strings()

    var channelObs = api.state.obs.channel(channel)

    //disable "Show More" button when we are at the last thread.
    var disableShowMore = computed([channelObs], threads => !!threads.ended)

    var updates = h('div.threads', [])
    var threadsHtmlObs = More(
      channelObs,
      function render (threads) {
        morphdom(updates,
          h('div.threads', Object.keys(threads.roots)
            .map(id => threads.roots[id])
            .filter(thread => get(thread, 'value.content.channel') == channel)
            .sort((a, b) => latestUpdate(b) - latestUpdate(a))
            .map(thread => api.app.html.blogCard(thread))
          )
        )
        return updates
      }
    )

    const Link = api.app.html.link

    // TODO change this to -channel
    return h('Page -home', {title: channel}, [
      Link({ page: 'threadNew', channel }, h('Button -strong', strings.channel.action.newThread)),
      h('div.content', [ threadsHtmlObs ]),
      h('Button -showMore', {
        'ev-click': threadsHtmlObs.more,
         disabled: disableShowMore
      }, [strings.showMore])
    ])
  })
}



const nest = require('depnest')
const { h, computed } = require('mutant')
const More = require('hypermore')
const morphdom = require('morphdom')

exports.gives = nest('app.page.channel')

exports.needs = nest({
  'app.html.nav': 'first',
  'app.html.threadCard': 'first',
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
    // location here can expected to be: { page: 'home' }
    var strings = api.translations.sync.strings()

    var container = h('div.container', [])

    var channelObs = api.state.obs.channel(location.channel)

    //disable "Show More" button when we are at the last thread.
    var disableShowMore = computed([channelObs], threads => !!threads.ended)

    var threadsHtmlObs = More(
      channelObs,
      function render (threads) {

        morphdom(container,
          // LEGACY: some of these containers could be removed
          // but they are here to be compatible with the old MCSS.
          h('div.container', [
            //private section
            h('section.updates -directMessage', [
              h('div.threads',
                Object.keys(threads.roots)
                .map(function (id) {
                  return threads.roots[id]
                })
                .sort(function (a, b) {
                  return latestUpdate(b) - latestUpdate(a)
                })
                .map(function (thread) {
                  return api.app.html.threadCard(thread)
                })
              )
            ])
          ])
        )
        return container
      }
    )

    return h('Page -home', [
      h('h1', location.channel),
      api.app.html.nav(),
      threadsHtmlObs,
      h('button', {
        'ev-click': threadsHtmlObs.more,
         disabled: disableShowMore
      }, [strings.showMore])
    ])
  })
}

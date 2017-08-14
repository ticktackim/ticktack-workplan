const nest = require('depnest')
const { h, computed } = require('mutant')
const {threadReduce} = require('ssb-reduce-stream')
const pull = require('pull-stream')
const isObject = require('lodash/isObject')
const isString = require('lodash/isString')
const last = require('lodash/last')
const get = require('lodash/get')
const More = require('hypermore')
const morphdom = require('morphdom')
const Debounce = require('obv-debounce')
const PullObv = require('pull-obv')
const Computed = require('mutant/computed')

exports.gives = nest('app.page.channel')

exports.needs = nest({
  'app.html.nav': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first',
  'state.obs.threads': 'first',
  'app.html.threadCard': 'first',
  'feed.pull.channel': 'first'
})

function toRecpGroup(msg) {
  //cannocialize
  return Array.isArray(msg.value.content.repcs) &&
    msg.value.content.recps.map(function (e) {
    return (isString(e) ? e : e.link)
  }).sort().map(function (id) {
    return id.substring(0, 10)
  }).join(',')
}

exports.create = (api) => {
  return nest('app.page.channel', function (location) {
    // location here can expected to be: { page: 'home' }
    var strings = api.translations.sync.strings()

    var container = h('div.container', [])

    function filterForThread (thread) {
      if(thread.value.private)
        return {private: toRecpGroup(thread)}
      else if(thread.value.content.channel)
        return {channel: thread.value.content.channel}
    }

    var createChannelStream = api.feed.pull.channel(location.channel)

    var channelObs = PullObv(
      threadReduce,
      createChannelStream({reverse: true, limit: 1000})
    )

    //disable "Show More" button when we are at the last thread.
    var disableShowMore = Computed([channelObs], function (threads) {
      return !!threads.ended
    })

    var threadsHtmlObs = More(
      channelObs,
      function render (threads) {

        var sorted = Object.keys(threads.roots)
        .map(function (id) {
          return threads.roots[id]
        })
        .sort(function (a, b) {
          return latestUpdate(b) - latestUpdate(a)
        })

        function latestUpdate(thread) {
          var m = thread.timestamp
          if(!thread.replies) return m

          for(var i = 0; i < thread.replies.length; i++)
            m = Math.max(thread.replies[i].timestamp, m)
          return m
        }

        morphdom(container,
          // LEGACY: some of these containers could be removed
          // but they are here to be compatible with the old MCSS.
          h('div.container', [
            //private section
            h('section.updates -directMessage', [
              h('div.threads', 
                sorted
                  .map(function (thread) {
                    var el = api.app.html
                      .threadCard(thread, opts)
                    return el
                })
              )
            ]),
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




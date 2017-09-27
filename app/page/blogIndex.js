const nest = require('depnest')
const { h } = require('mutant')

const isString = require('lodash/isString')
const More = require('hypermore')
const morphdom = require('morphdom')
const Debounce = require('obv-debounce')

exports.gives = nest('app.page.blogIndex')

exports.needs = nest({
  'app.html.context': 'first',
  'app.html.threadCard': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first',
  'state.obs.threads': 'first',
  'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  var contentHtmlObs

  return nest('app.page.blogIndex', function (location) {
    // location here can expected to be: { page: 'blogIndex'}
    //
    var strings = api.translations.sync.strings()

    return h('Page -blogIndex', {title: strings.home}, [
      api.app.html.context(location),
      h('div.content', [
        blogs(),
        h('Button -showMore', { 'ev-click': contentHtmlObs.more }, strings.showMore)
      ]),
    ])
  })

  function blogs () {
    // TODO - replace with actual blogs
    var morePlease = false
    var threadsObs = api.state.obs.threads()

    // DUCT TAPE: debounce the observable so it doesn't
    // update the dom more than 1/second
    threadsObs(function () {
      if(morePlease) threadsObs.more()
    })
    threadsObsDebounced = Debounce(threadsObs, 1000)
    threadsObsDebounced(function () {
      morePlease = false
    })
    threadsObsDebounced.more = function () {
      morePlease = true
      requestIdleCallback(threadsObs.more)
    }

    var updates = h('div.threads', [])
    contentHtmlObs = More(
      threadsObsDebounced,
      function render (threads) {

        function latestUpdate(thread) {
          var m = thread.timestamp || 0
          if(!thread.replies) return m

          for(var i = 0; i < thread.replies.length; i++)
            m = Math.max(thread.replies[i].timestamp||0, m)
          return m
        }

        var o = {}
        function roots (r) {
          return Object.keys(r || {}).map(function (name) {
            var id = r[name]
            if(!o[id]) {
              o[id] = true
              return threads.roots[id]
            }
          }).filter(function (e) {
            return e && e.value
          })
        }

        var groupedThreads = roots(threads.private)
          .concat(roots(threads.channels))
          .concat(roots(threads.groups))
          .filter(function (thread) {
            return thread.value.content.recps || thread.value.content.channel
          })
          .map(function (thread) {
            var unread = 0
            if(api.unread.sync.isUnread(thread))
              unread ++
            ;(thread.replies || []).forEach(function (msg) {
              if(api.unread.sync.isUnread(msg)) unread ++
            })
            thread.unread = unread
            return thread
          })
          .sort((a, b) => latestUpdate(b) - latestUpdate(a))

        morphdom(
          updates,
          h('div.threads',
            groupedThreads.map(thread => {
              const { recps, channel } = thread.value.content
              var onClick
              if (channel && !recps)
                onClick = (ev) => api.history.sync.push({ channel })

              return api.app.html.threadCard(thread, { onClick })
            })
          )
        )

        return updates
      }
    )

    return contentHtmlObs 
  }
}


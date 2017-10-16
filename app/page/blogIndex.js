const nest = require('depnest')
const { h } = require('mutant')

const isString = require('lodash/isString')
const More = require('hypermore')
const morphdom = require('morphdom')
const Debounce = require('obv-debounce')

exports.gives = nest('app.page.blogIndex')

exports.needs = nest({
  'app.html.context': 'first',
  'app.html.blogCard': 'first',
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
        h('Button -primary', { 'ev-click': () => api.history.sync.push({ page: 'blogNew' }) }, strings.blogNew.actions.writeBlog),
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

    var updates = h('div.blogs', [])
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

        var groupedThreads =
          Object.keys(threads.roots || {}).map(function (id) {
            return threads.roots[id]
          })
          .filter(function (thread) {
            return thread.value
          })
          .filter(function (thread) {
            //show public messages only
            return !thread.value.content.recps
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
          h('div.blogs',
            groupedThreads.map(thread => {
              const { recps, channel } = thread.value.content
              var onClick
              if (channel && !recps)
                onClick = (ev) => api.history.sync.push({ key: thread.key, page: 'blogShow' })

              return api.app.html.blogCard(thread, { onClick })
            })
          )
        )

        return updates
      }
    )

    return contentHtmlObs 
  }
}


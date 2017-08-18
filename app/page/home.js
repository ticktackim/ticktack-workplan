const nest = require('depnest')
const { h } = require('mutant')
const isString = require('lodash/isString')
const More = require('hypermore')
const morphdom = require('morphdom')
const Debounce = require('obv-debounce')

exports.gives = nest('app.page.home')

exports.needs = nest({
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first',
  'state.obs.threads': 'first',
  'app.html.threadCard': 'first',
  'unread.sync.isUnread': 'first'
})

// function toRecpGroup(msg) {
//   //cannocialize
//   return Array.isArray(msg.value.content.repcs) &&
//     msg.value.content.recps.map(function (e) {
//     return (isString(e) ? e : e.link)
//   }).sort().map(function (id) {
//     return id.substring(0, 10)
//   }).join(',')
// }

exports.create = (api) => {
  return nest('app.page.home', function (location) {
    // location here can expected to be: { page: 'home'}
    var strings = api.translations.sync.strings()


    // function filterForThread (thread) {
    //   if(thread.value.private)
    //     return {private: toRecpGroup(thread)}
    //   else if(thread.value.content.channel)
    //     return {channel: thread.value.content.channel}
    // }

    // function filter (rule, thread) {
    //   if(!thread.value) return false
    //   if(!rule) return true
    //   if(rule.channel) {
    //     return rule.channel == thread.value.content.channel
    //   }
    //   else if(rule.group)
    //     return rule.group == thread.value.content.group
    //   else if(rule.private)
    //     return rule.private == toRecpGroup(thread)
    //   else return true
    // }

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
    var threadsHtmlObs = More(
      threadsObsDebounced,
      function render (threads) {

        function latestUpdate(thread) {
          var m = thread.timestamp || 0
          if(!thread.replies) return m

          for(var i = 0; i < thread.replies.length; i++)
            m = Math.max(thread.replies[i].timestamp||0, m)
          return m
        }

        function roots (r) {
          return Object.keys(r || {}).map(function (k) {
            return threads.roots[r[k]]
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
    return h('Page -home', {title: strings.home}, [
      h('div.container', [ threadsHtmlObs ]),
      h('Button -showMore', { 'ev-click': threadsHtmlObs.more }, strings.showMore)
    ])
  })
}


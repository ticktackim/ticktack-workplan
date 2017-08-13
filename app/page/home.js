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

exports.gives = nest('app.page.home')

exports.needs = nest({
  'app.html.nav': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first',
  'state.obs.threads': 'first',
  'app.html.threadCard': 'first'
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
  return nest('app.page.home', function (location) {
    // location here can expected to be: { page: 'home' }
    var strings = api.translations.sync.strings()

    var container = h('div.container', [])

    function filterForThread (thread) {
      if(thread.value.private)
        return {private: toRecpGroup(thread)}
      else if(thread.value.content.channel)
        return {channel: thread.value.content.channel}
    }

    function filter (rule, thread) {
      if(!thread.value) return false
      if(!rule) return true
      if(rule.channel) {
        return rule.channel == thread.value.content.channel
      }
      else if(rule.group)
        return rule.group == thread.value.content.group
      else if(rule.private)
        return rule.private == toRecpGroup(thread)
      else return true
    }

    var morePlease = false
    var threadsObs = api.state.obs.threads()
    var threadsObsDebounced = function (fn) {
      var ts = 0, timer
      threadsObs(function (v) {
        if(Date.now() > ts + 1000) {
          console.log('threads', Object.keys(v.roots).length, v.stats)
          morePlease = false
          ts = Date.now()
          fn(v)
        }
        else {
          clearTimeout(timer)
          timer = setTimeout(function () {
            ts = Date.now()
            morePlease = false
            fn(threadsObs.value)
          }, 1000)
        }
        if(morePlease) threadsObs.more()
      })

    }

    threadsObsDebounced.more = function () {
      morePlease = true
      threadsObs.more()
    }

    var threadsHtmlObs = More(
      threadsObsDebounced,
      function render (threads) {
        morphdom(container,
          //some of these containers could be removed
          //but they are here to be compatible with the old MCSS.
          h('div.container', [
            //private section
            h('section.updates -directMessage', [
              h('div.threads', 
                Object.keys(threads.roots)
                  .map(function (id) {
                    return threads.roots[id]
                  })
                  .filter(function (thread) {
                    return filter(location.filter, thread)
                  })
                  .map(function (thread) {
                    var el = api.app.html
                      .threadCard(null, thread, opts)
                    if(!location.filter && el)
                      el.onclick = function () {
                        api.history.sync.push({page: 'home', filter: filterForThread(thread)})
                      }
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
      h('h1', 'Home'),
      api.app.html.nav(),
      threadsHtmlObs,
      h('button', {'ev-click': threadsHtmlObs.more}, [strings.showMore])
    ])
  })
}


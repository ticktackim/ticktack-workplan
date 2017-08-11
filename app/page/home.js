const nest = require('depnest')
const { h } = require('mutant')
const {threadReduce} = require('ssb-reduce-stream')
const pull = require('pull-stream')
const isObject = require('lodash/isObject')
const isString = require('lodash/isString')
const last = require('lodash/last')
const get = require('lodash/get')
const More = require('hypermore')
exports.gives = nest('app.page.home')
const morphdom = require('morphdom')
const Next = require('pull-next')

exports.needs = nest({
  'about.html.image': 'first',
  'app.html.nav': 'first',
  'sbot.pull.log': 'first',
  'history.sync.push': 'first',
  'message.sync.unbox': 'first',
})

function firstLine (text) {
  if(text.length < 80 && !~text.indexOf('\n')) return text

  return text.split('\n')[0].substring(0, 80)
}

exports.create = (api) => {
  return nest('app.page.home', function (location) {
    // location here can expected to be: { page: 'home' }

    var container = h('div.container', [])

    function subject (msg) {
      const { subject, text } = msg.value.content
      return firstLine(subject|| text)
    }

    function link(location) {
      return {'ev-click': () => api.history.sync.push(location)}
    }

    function item (name, thread) {
      if(!thread.value) return
      const lastReply = thread.replies && last(thread.replies)

      return h('div.threadLink', link(thread), [
        name,
        h('div.subject', [subject(thread)]),
        lastReply ? h('div.reply', [subject(lastReply)]) : null
      ])
    }

    function threadGroup (threads, obj, toName) {
      // threads = a state object for all the types of threads
      // obj = a map of keys to root ids, where key ∈ (channel | group | concatenated list of pubkeys)
      // toName = fn that derives a name from a particular thread

      var groupEl = h('div.group')
      for(var k in obj) {
        var id = obj[k]
        var thread = get(threads, ['roots', id])
        if(thread && thread.value) {
          var el = item(toName(k, thread), thread)
          if(el) groupEl.appendChild(el)
        }
      }
      return groupEl
    }

    var initial
    try { initial = JSON.parse(localStorage.threadsState) }
    catch (_) { }
    var lastTimestamp = initial ? initial.last : Date.now()

    var timer
    function update (threadsState) {
      clearTimeout(timer)
      setTimeout(function () {
        threadsState.last = lastTimestamp
        localStorage.threadsState = JSON.stringify(threadsState)
      }, 1000)
    }

    var threadsObs = More(
      threadReduce,
      pull(
        Next(function () {
          return api.sbot.pull.log({reverse: true, limit: 500, lte: lastTimestamp})
        }),
        pull.map(function (data) {
          lastTimestamp = data.timestamp
          if(isObject(data.value.content)) return data
          return api.message.sync.unbox(data)
        }),
        pull.filter(Boolean),
        function (read) {
          return function (abort, cb) {
            read(abort, function (err, data) {
              try {
                cb(err, data)
              } catch (err) {
                console.error(err)
                read(err, function () {})
              }
            })
          }
        }
      ),
      function render (threadsState) {
        update(threadsState)
        morphdom(container,
          h('div.container', [
          threadGroup(
            threadsState,
            threadsState.private,
            function (_, msg) {
              // NB: msg passed in is actually a 'thread', but only care about root msg
              return h('div.recps', [
                msg.value.content.recps.map(function (link) {
                  return api.about.html.image(isString(link) ? link : link.link)
                })
              ])
            }
          ),
          threadGroup(
            threadsState,
            threadsState.channels,
            ch => h('h2.title', '#'+ch)
          )
        ])
        )
        return container
      },
      initial
    )

    return h('Page -home', [
      h('h1', 'Home'),
      api.app.html.nav(),
      threadsObs,
      h('button', {'ev-click': threadsObs.more}, ['Show More'])
    ])
  })
}


const nest = require('depnest')
const { h } = require('mutant')
const {threadReduce} = require('ssb-reduce-stream')
const pull = require('pull-stream')
const isObject = require('lodash/isObject')
const isString = require('lodash/isString')
const last = require('lodash/last')
const get = require('lodash/get')

exports.gives = nest('app.page.home')

exports.needs = nest({
  'about.html.image': 'first',
  'app.html.nav': 'first',
  'feed.pull.public': 'first',
  'history.sync.push': 'first',
  'message.sync.unbox': 'first',
})

function firstLine (text) {
  if(text.length < 80 && !~text.indexOf('\n')) return text

  return text.split('\n')[0].substring(0, 80)
}

exports.create = (api) => {
  return nest('app.page.home', home)

  function home (location) {
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

    pull(
      api.feed.pull.public({reverse: true, limit: 1000}),
      pull.collect(function (err, messages) {

        var threads = messages
          .map(function (data) {
            if(isObject(data.value.content)) return data
            return api.message.sync.unbox(data)
          })
          .filter(Boolean)
          .reduce(threadReduce, null)

        container.appendChild(threadGroup(
          threads,
          threads.private,
          function (_, msg) {    
            // NB: msg passed in is actually a 'thread', but only care about root msg
 
            return h('div.recps', [
              msg.value.content.recps.map(function (link) {
                return api.about.html.image(isString(link) ? link : link.link)
              })
            ])
          }
        ))

        container.appendChild(threadGroup(
          threads,
          threads.channels,
          ch => h('h2.title', '#'+ch)
        ))
      })
    )

    return h('Page -home', [
      h('h1', 'Home'),
      api.app.html.nav(),
      container
    ])
  }
}


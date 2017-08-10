const nest = require('depnest')
const { h } = require('mutant')
const {threadReduce} = require('ssb-reduce-stream')
const pull = require('pull-stream')
const when = require('mutant/when')
const isObject = require('lodash/isObject')
const isString = require('lodash/isString')

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
      return firstLine(msg.content.subject || msg.content.text)
    }

    function link(location) {
      return {'ev-click': () => api.history.sync.push(location)}
    }

    function item (name, thread) {
      var reply = thread.replies && thread.replies[thread.replies.length-1]
      if(!thread.value) return

      return h('div.threadLink', link(thread), [
        name,
        h('div.subject', [subject(thread.value)]),
        reply ? h('div.reply', [subject(reply.value)]) : null
      ])
    }

    function threadGroup (threads, obj, toName) {
      var div = h('div.group')
      for(var k in obj) {
        var id = obj[k]
        var thread = threads.roots[id]
        if(threads.roots[id] && threads.roots[id].value) {
          //throw new Error('missing thread:'+id+' for channel:'+k)
          var el = item(toName(k, thread), thread)
          if(el) div.appendChild(el)
        }
      }
      return div
    }

    pull(
      api.feed.pull.public({reverse: true, limit: 1000}),
      pull.through(console.log),
      pull.collect(function (err, messages) {

        var threads = messages.map(function (data) {
          if(isObject(data.value.content)) return data
          return api.message.sync.unbox(data)
        }).filter(Boolean).reduce(threadReduce, null)

        container.appendChild(threadGroup(
          threads,
          threads.private,
          function (_, msg) {
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




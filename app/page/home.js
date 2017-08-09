const nest = require('depnest')
const { h } = require('mutant')
const {threadReduce} = require('ssb-reduce-stream')
const pull = require('pull-stream')

exports.gives = nest('app.page.home')

exports.needs = nest({
  'app.sync.goTo': 'first',
  'feed.pull.public': 'first'
})

function firstLine (text) {
  if(text.length < 80 && !~text.indexOf('\n')) return text

  return text.split('\n')[0].substring(0, 80)
}

exports.create = (api) => {
  return nest('app.page.home', home)

  function home (location) {
    // location here can expected to be: { page: 'home' }
    const { goTo } = api.app.sync

    var div = h('div', [])

    function subject (msg) {
      return firstLine(msg.content.subject || msg.content.text)
    }

    function item (name, thread) {
      var reply = thread.replies && thread.replies[thread.replies.length-1]
      if(!thread.value) {

      }
      if(!thread.value) return
      return h('div', [
          h('h2', name),
          h('div.subject', [subject(thread.value)]),
          reply ? h('div.reply', [subject(reply.value)]) : null
        ]
      )
    }

    pull(
      api.feed.pull.public({reverse: true, limit: 1000}),
      pull.through(console.log),
      pull.collect(function (err, messages) {
        var threads = messages.reduce(threadReduce, null)
        for(var k in threads.channels) {
          var id = threads.channels[k]
          if(!threads.roots[id]) throw new Error('missing thread:'+id+' for channel:'+k)
          var el = item(k, threads.roots[id])
          if(el)
            div.appendChild(el)
        }
      })
    )

    return div


    return h('div', [
      h('h1', 'Home'),
      h('div', { 'ev-click': () => goTo({ page: 'home' }) }, 'Home'),
      h('div', { 'ev-click': () => goTo({ type: 'group', key: '%sadlkjas;lkdjas' }) }, 'Group')
    ])
  }
}













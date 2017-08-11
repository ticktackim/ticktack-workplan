const nest = require('depnest')
const { h, computed } = require('mutant')
const {threadReduce} = require('ssb-reduce-stream')
const pull = require('pull-stream')
const isObject = require('lodash/isObject')
const isString = require('lodash/isString')
const last = require('lodash/last')
const get = require('lodash/get')

exports.gives = nest('app.page.home')

exports.needs = nest({
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'app.html.nav': 'first',
  'feed.pull.public': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'message.sync.unbox': 'first',
  'message.html.markdown': 'first'
})

function firstLine (text) {
  if(text.length < 80 && !~text.indexOf('\n')) return text

  var line = ''
  var lineNumber = 0
  while (line.length === 0) {
    const rawLine = text.split('\n')[lineNumber]
    line = trimLeadingMentions(rawLine)

    lineNumber++
  }

  var sample = line.substring(0, 80)
  if (hasBrokenLink(sample))
    sample = sample + line.substring(81).match(/[^\)]*\)/)[0]

  return sample

  function trimLeadingMentions (str) {
    return str.replace(/^(\s*\[@[^\)]+\)\s*)*/, '')
    // deletes any number of pattern " [@...)  " from start of line
  }

  function hasBrokenLink (str) {
    return /\[[^\]]*\]\([^\)]*$/.test(str)
    // matches "[name](start_of_link"
  }
}

exports.create = (api) => {
  return nest('app.page.home', home)

  function home (location) {
    // location here can expected to be: { page: 'home' }

    var container = h('div.container', [])

    function subject (msg) {
      const { subject, text } = msg.value.content
      return api.message.html.markdown(firstLine(subject|| text))
    }

    function link(location) {
      return {'ev-click': () => api.history.sync.push(location)}
    }

    function item (context, thread) {
      if(!thread.value) return
      const lastReply = thread.replies && last(thread.replies)
      const replyEl = lastReply
        ? h('div.reply', [
          h('div.author', [api.about.obs.name(lastReply.value.author), ':']),
          subject(lastReply)
        ])
        : null

      return h('div.thread', link(thread), [
        h('div.context', context),
        h('div.content', [
          h('div.subject', [subject(thread)]),
          replyEl
        ])
      ])
    }

    function threadGroup (threads, obj, toName) {
      // threads = a state object for all the types of threads
      // obj = a map of keys to root ids, where key ∈ (channel | group | concatenated list of pubkeys)
      // toName = fn that derives a name from a particular thread
 
      var groupEl = h('div.threads')
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

        const privateUpdatesSection = h('section.updates -directMessage', [
          h('h2', 'Direct Messages'),
          threadGroup(
            threads,
            threads.private,
            function (_, msg) {    
              // NB: msg passed in is actually a 'thread', but only care about root msg
              const myId = api.keys.sync.id()
   
              return msg.value.content.recps
                .map(link => isString(link) ? link : link.link)
                .filter(link => link !== myId) 
                .map(api.about.html.image)
              
            }
          )
        ])

        const channelUpdatesSection = h('section.updates -channel', [
          h('h2', 'Channels'),
          threadGroup(
            threads,
            threads.channels,
            ch => '#'+ch
          )
        ])

        const groupUpdatesSection = h('section.updates -group', [
          h('h2', 'Groups'),
          'TODO: complete + enable when groups are live'
          // threadGroup(
          //   threads,
          //   threads.groups,
          //   toName ...
          // )
        ])

        container.appendChild(privateUpdatesSection)
        container.appendChild(channelUpdatesSection)
        container.appendChild(groupUpdatesSection)
      })
    )

    return h('Page -home', [
      h('h1', 'Home'),
      api.app.html.nav(),
      container
    ])
  }
}


const nest = require('depnest')
const { h, computed } = require('mutant')
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
  'about.obs.name': 'first',
  'app.html.nav': 'first',
  'sbot.pull.log': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'message.sync.unbox': 'first',
  'message.html.markdown': 'first'
})

var strings = {
  showMore: "Show More",
  channels: "Channels",
  directMessages: "Direct Messages",
  replySymbol: "> "
}

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
  return nest('app.page.home', function (location) {
    // location here can expected to be: { page: 'home' }

    var container = h('div.container', [])

    function subject (msg) {
      const { subject, text } = msg.value.content
      return api.message.html.markdown(firstLine(subject|| text))
    }

    function link(location) {
      return {'ev-click': () => api.history.sync.push(location)}
    }

    function item (context, thread, opts = {}) {
      if(!thread.value) return

      const subjectEl = h('div.subject', [
        opts.nameRecipients
          ?  h('div.recps', buildRecipientNames(thread).map(recp => h('div.recp', recp)))
          : null,
        subject(thread)
      ])

      const lastReply = thread.replies && last(thread.replies)
      const replyEl = lastReply
        ? h('div.reply', [
            h('div.replySymbol', strings.replySymbol),
            subject(lastReply)
          ])
        : null


      // REFACTOR: move this to a template?
      function buildRecipientNames (thread) {
        const myId = api.keys.sync.id()

        return thread.value.content.recps
          .map(link => isString(link) ? link : link.link)
          .filter(link => link !== myId)
          .map(api.about.obs.name)
      }

      return h('div.thread', link(thread), [
        h('div.context', context),
        h('div.content', [
          subjectEl,
          replyEl
        ])
      ])
    }

    function threadGroup (threads, obj, toContext, opts) {
      // threads = a state object for all the types of threads
      // obj = a map of keys to root ids, where key (channel | group | concatenated list of pubkeys)
      // toContext = fn that derives the context of the group
      // opts = { nameRecipients }

      var groupEl = h('div.threads')
      for(var k in obj) {
        var id = obj[k]
        var thread = get(threads, ['roots', id])
        if(thread && thread.value) {
          var el = item(toContext(k, thread), thread, opts)
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
        pull.filter(Boolean)
      ),
      function render (threads) {
        update(threads)
        morphdom(container,
          h('div.container', [
            //private section
            h('section.updates -directMessage', [
              h('h2', strings.directMessages),
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
                },
                { nameRecipients: true }
              )
            ]),
            //channels section
            h('section.updates -channel', [
              h('h2', strings.channels),
              threadGroup(
                threads,
                threads.channels,
                ch => '#'+ch
              )
            ]),
            //group section
            h('section.updates -group', [
              h('h2', 'Groups'),
              'TODO: complete + enable when groups are live'
              // threadGroup(
              //   threads,
              //   threads.groups,
              //   toName ...
              // )
            ])
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
      h('button', {'ev-click': threadsObs.more}, [strings.showMore])
    ])
  })
}


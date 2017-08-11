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
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'app.html.nav': 'first',
  'sbot.pull.log': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'message.sync.unbox': 'first',
  'message.html.markdown': 'first',
  'translations.sync.strings': 'first',
  'state.obs.threads': 'first',
  'app.html.threadCard': 'first'
})

exports.create = (api) => {
  return nest('app.page.home', function (location) {
    // location here can expected to be: { page: 'home' }
    var strings = api.translations.sync.strings()

    var container = h('div.container', [])

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
          var el = api.app.html.threadCard(toContext(k, thread), thread, opts)
          if(el) groupEl.appendChild(el)
        }
      }
      return groupEl
    }

    var threadsObs = api.state.obs.threads()

    var threadsHtmlObs = More(
      threadsObs,
      function render (threads) {
        morphdom(container,
          h('div.container', [
            //private section
            h('section.updates -directMessage', [
              h('div.threads', 
                Object.keys(threads.roots).map(function (id) {
              
                  return api.app.html
                    .threadCard(null, threads.roots[id], opts)
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


const nest = require('depnest')
const { h, watch, when, computed, Value, Set: MutantSet } = require('mutant')
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const ref = require('ssb-ref')
const throttle = require('mutant/throttle')
const MutantPullReduce = require('mutant-pull-reduce')


exports.gives = nest('app.page.channelSubscriptions')

exports.needs = nest({
  'app.html.sideNav': 'first',
  'app.html.topNav': 'first',
  'app.html.scroller': 'first',
  'app.html.channelCard': 'first',

  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'channel.obs.subscribed': 'first',
  'channel.html.link': 'first',
  'translations.sync.strings': 'first',
  'sbot.async.friendsGet': 'first',
  'sbot.pull.userFeed': 'first'
})

exports.create = (api) => {
  return nest('app.page.channelSubscriptions', function (location) {
    const strings = api.translations.sync.strings()
    const myId = api.keys.sync.id()
    const { subscribed } = api.channel.obs
    let myChannels, displaySubscriptions

    if (location.scope === "user") {
      myChannels = subscribed(myId)
      displaySubscriptions = () => [...myChannels().values()].map(c => api.app.html.channelCard(c))

      return h('Page -channelSubscriptions', { title: strings.home }, [
        api.app.html.sideNav(location),
        h('div.content', [
          //api.app.html.topNav(location),
          when(myChannels, displaySubscriptions, h("p", "Loading..."))
        ])
      ])

    }

    if (location.scope === "friends") {

      function createStream() {
        var p = Pushable(true) // optionally pass `onDone` after it

        api.sbot.async.friendsGet({ dest: myId }, (err, friends) => {
          for (f in friends) {
            var s = subscribed(f)
            s(c => [...c].map(x => p.push(x)))
          }
        })

        return p.source
      }

      var stream = createStream()
      var opts = {
        startValue: new Set(),
        nextTick: true
      }

      var channelList = api.app.html.scroller({
        classList: ['content'],
        stream: createStream,
        render
      })

      function render(channel) {
        return api.app.html.channelCard(channel)
      }

      return h('Page -channelSubscriptions', { title: strings.home }, [
        api.app.html.sideNav(location),
        channelList
      ])
    }
  })
}





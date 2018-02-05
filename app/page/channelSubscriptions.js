const nest = require('depnest')
const { h, watch, when, computed, Value, onceTrue } = require('mutant')
const pull = require('pull-stream')
const Pushable = require('pull-pushable')
const ref = require('ssb-ref')
const throttle = require('mutant/throttle')
const MutantPullReduce = require('mutant-pull-reduce')
const sortBy = require('lodash/sortBy')
const get = require("lodash/get")
const map = require("lodash/map")


exports.gives = nest('app.page.channelSubscriptions')

exports.needs = nest({
  'app.html.sideNav': 'first',
  'app.html.topNav': 'first',
  'app.html.scroller': 'first',
  'app.html.channelCard': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'channel.obs.subscribed': 'first',
  'channel.obs.recent':'first',
  'channel.html.link': 'first',
  'translations.sync.strings': 'first',
  'sbot.async.friendsGet': 'first',
  'sbot.pull.userFeed': 'first',
  'sbot.obs.connection': 'first'
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

      myChannels = Value(false)

      onceTrue(
        api.sbot.obs.connection,
        sbot => {
          sbot.channel.get((err, c) => {
            if (err) throw err
            let b = map(c, (v,k) => {return {channel: k, users: v}})
            b = sortBy(b, o => o.users.length)
            myChannels.set(b.reverse().slice(0,100))
          })
        }
      )


      displaySubscriptions = () => {
        if (myChannels()) {
          let subs = myChannels()
          return subs.map(c => api.app.html.channelCard(c.channel))
        }
      }

      return h('Page -channelSubscriptions', { title: strings.home }, [
        api.app.html.sideNav(location),
        h('div.content', [
          when(myChannels, displaySubscriptions, h("p", strings.loading))
        ])
      ])
    }
  })
}





const nest = require('depnest')
const { h, when, Value, Array: MutantArray, onceTrue, computed, map: mutantMap } = require('mutant')
const sortBy = require('lodash/sortBy')
const map = require('lodash/map')
const difference = require('lodash/difference')

exports.gives = nest('app.page.channelSubscriptions')

exports.needs = nest({
  'app.html.sideNav': 'first',
  'app.html.topNav': 'first',
  'app.html.scroller': 'first',
  'app.html.channelCard': 'first',
  'app.obs.pluginWarnings': 'first',
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
  const otherChannels = MutantArray ()

  return nest('app.page.channelSubscriptions', function (location) {
    const strings = api.translations.sync.strings()
    const myId = api.keys.sync.id()

    const rawSubs = api.channel.obs.subscribed(myId)
    const mySubs = computed(rawSubs, myChannels => [...myChannels.values()].reverse() )

    if (location.scope === "user") {

      return h('Page -channelSubscriptions', { title: strings.home }, [
        api.app.html.sideNav(location),
        h('div.content', [
          when(rawSubs.sync, 
            [
              computed(mySubs, mys => mys.length === 0 ? strings.subscriptions.state.noSubscriptions : ''),
              mutantMap(mySubs, api.app.html.channelCard), 
            ],
            h('p', strings.loading)
          )
        ])
      ])
    }

    if (location.scope === "friends") {
      // update list of other all channels
      onceTrue(
        api.app.obs.pluginWarnings,
        isWarnings => {
          if (isWarnings) {
            return
          }
          onceTrue(api.sbot.obs.connection, getChannels)
        }
      )

      const showMoreCounter = Value(1)
      const newChannels = computed([otherChannels, mySubs, showMoreCounter], (other, mine, more) => {
        return difference(other, mine)
          .slice(0, 10*more)
      })

      return h('Page -channelSubscriptions', { title: strings.home }, [
        api.app.html.sideNav(location),
        h('div.content', [
          when(otherChannels,
            [
              mutantMap(newChannels, api.app.html.channelCard),
              h('Button', { 'ev-click': () => showMoreCounter.set(showMoreCounter()+1) },
                strings.showMore
              )
            ],
            h('p', strings.loading)
          )
        ])
      ])
    }
  })

  function getChannels (sbot) {
    sbot.channel.subscriptions((err, c) => {
      if (err) throw err
      let b = map(c, (v,k) => {return {channel: k, users: v}})
      b = sortBy(b, o => o.users.length)
      let res = b.reverse()

      otherChannels.set(res.map(c => c.channel))
    })
  }
}


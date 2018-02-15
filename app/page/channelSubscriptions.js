const nest = require('depnest')
const { h, when, Value, Array: MutantArray, onceTrue, watch, computed, map: mutantMap } = require('mutant')
const sortBy = require('lodash/sortBy')
const map = require('lodash/map')
const difference = require('lodash/difference')

exports.gives = nest('app.page.channelSubscriptions')

exports.needs = nest({
  'app.html.sideNav': 'first',
  'app.html.topNav': 'first',
  'app.html.scroller': 'first',
  'app.html.channelCard': 'first',
  'app.obs.pluginsOk': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'channel.obs.subscribed': 'first',
  'channel.obs.recent': 'first',
  'channel.html.link': 'first',
  'translations.sync.strings': 'first',
  'sbot.async.friendsGet': 'first',
  'sbot.pull.userFeed': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = (api) => {
  const allChannels = MutantArray()

  return nest('app.page.channelSubscriptions', function (location) {
    const strings = api.translations.sync.strings()
    const myId = api.keys.sync.id()

    const rawSubs = api.channel.obs.subscribed(myId)
    const mySubs = computed(rawSubs, myChannels => [...myChannels.values()].reverse())

    if (location.scope === 'user') {
      return h('Page -channelSubscriptions', { title: strings.home }, [
        api.app.html.sideNav(location),
        h('div.content', [
          when(rawSubs.sync,
            [
              computed(mySubs, mys => mys.length === 0 ? strings.subscriptions.state.noSubscriptions : ''),
              mutantMap(mySubs, api.app.html.channelCard)
            ],
            h('p', strings.loading)
          )
        ])
      ])
    }

    if (location.scope === 'friends') {
      // update list of other all channels
      // NOTE can't use onceTrue right now, because warnings are true/ false
      watch(
        api.app.obs.pluginsOk(),
        ok => {
          if (!ok) return
          onceTrue(api.sbot.obs.connection, getChannels)
        }
      )
      // TODO - refactor this to use the cache in channel.obs.subscribed

      const showMoreCounter = Value(1)
      const newChannels = computed([allChannels, mySubs, showMoreCounter], (all, mine, more) => {
        return difference(all, mine)
          .slice(0, 10 * more)
      })

      return h('Page -channelSubscriptions', { title: strings.home }, [
        api.app.html.sideNav(location),
        h('div.content', [
          when(allChannels,
            [
              mutantMap(newChannels, api.app.html.channelCard),
              h('Button', { 'ev-click': () => showMoreCounter.set(showMoreCounter() + 1) },
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
    console.log('fetching channel subscriptions')
    sbot.channel.subscriptions((err, c) => {
      if (err) throw err
      let b = map(c, (v,k) => {return {channel: k, users: v.map(e=> e[0]) }})
      b = sortBy(b, o => o.users.length)
      let res = b.reverse()

      allChannels.set(res.map(c => c.channel))
    })
  }
}


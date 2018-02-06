const nest = require('depnest')
const { h, when, Value, onceTrue, computed, map: mutantMap } = require('mutant')
const sortBy = require('lodash/sortBy')
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
      
      const mySubscriptions = computed(myChannels, myChannels => [...myChannels.values()])

      return h('Page -channelSubscriptions', { title: strings.home }, [
        api.app.html.sideNav(location),
        h('div.content', [
          //api.app.html.topNav(location),
          when(myChannels, 
            myChannels().size === 0
              ? strings.subscriptions.state.noSubscriptions
            :''
          ),
          when(myChannels, 
            mutantMap(mySubscriptions, api.app.html.channelCard), 
            h("p", strings.loading)
          )
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
            let res = b.reverse().slice(0,100)

            myChannels.set(res.map(c => c.channel))
          })
        }
      )


        return h('Page -channelSubscriptions', { title: strings.home }, [
        api.app.html.sideNav(location),
        h('div.content', [
            when(myChannels,
                mutantMap(myChannels, api.app.html.channelCard),
                h("p", strings.loading)
            )
        ])
      ])
    }
  })
}





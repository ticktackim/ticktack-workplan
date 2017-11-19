const nest = require('depnest')
const { h, computed, map, when, Dict, dictToCollection, Array: MutantArray, resolve } = require('mutant')
const pull = require('pull-stream')
const next = require('pull-next-step')
const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')

exports.gives = nest('app.html.context')

exports.needs = nest({
  'app.html.scroller': 'first',
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'feed.pull.private': 'first',
  'feed.pull.rollup': 'first',
  'keys.sync.id': 'first',
  'history.sync.push': 'first',
  'message.html.subject': 'first',
  'sbot.obs.localPeers': 'first',
  'translations.sync.strings': 'first',
})


exports.create = (api) => {
  return nest('app.html.context', (location) => {

    const strings = api.translations.sync.strings()
    const myKey = api.keys.sync.id()

    var nearby = api.sbot.obs.localPeers()
    var recentMsgLog = Dict ()
    function updateRecentMsgLog (msg) {
      const { author, timestamp } = msg.value

      if (!recentMsgLog.has(author)) {
        recentMsgLog.put(author, msg)
        return
      }

      const currentWinner = recentMsgLog.get(author)
      if (timestamp > currentWinner.value.timestamp) {
        recentMsgLog.put(author, msg)
      }
    }
    function isLatestMsg (msg) {
      const { author, timestamp } = msg.value
      return recentMsgLog.get(author).value.timestamp === timestamp
    }

    return h('Context -feed', [
      LevelOneContext(),
      LevelTwoContext()
    ])

    function LevelOneContext () {
      function isDiscoverContext (loc) {
        const PAGES_UNDER_DISCOVER = ['blogIndex', 'blogShow', 'home']

        return PAGES_UNDER_DISCOVER.includes(location.page)
          || get(location, 'value.private') === undefined
      }

      const prepend = [
        // Nearby
        computed(nearby, n => !isEmpty(n) ? h('header', strings.peopleNearby) : null),
        map(nearby, feedId => Option({
          notifications: Math.random() > 0.7 ? Math.floor(Math.random()*9+1) : 0, // TODO 
          imageEl: api.about.html.avatar(feedId, 'small'),
          label: api.about.obs.name(feedId),
          selected: location.feed === feedId,
          location: computed(recentMsgLog, recent => {
            const lastMsg = recent[feedId]
            return lastMsg
              ? Object.assign(lastMsg, { feed: feedId })
              : { page: 'threadNew', feed: feedId }
          }),
        }), { comparer: (a, b) => a === b }),
      
        // ---------------------
        computed(nearby, n => !isEmpty(n) ?  h('hr') : null),

        // Discover
        Option({
          notifications: Math.floor(Math.random()*5+1),
          imageEl: h('i.fa.fa-binoculars'),
          label: strings.blogIndex.title,
          selected: isDiscoverContext(location),
          location: { page: 'blogIndex' },
        })
      ]

      return api.app.html.scroller({
        classList: [ 'level', '-one' ],
        prepend,
        stream: api.feed.pull.private,
        filter: pull(
          pull.filter(msg => msg.value.content.type === 'post'), // TODO is this the best way to protect against votes?
          pull.filter(msg => msg.value.author != myKey),
          pull.filter(msg => msg.value.content.recps),
          pull.through(updateRecentMsgLog),
          pull.filter(isLatestMsg)
          //pull.through( // trim exisiting from content up Top case) // do this with new updateTop in mutant-scroll
        ),
        render: (msg) => {
          const { author } = msg.value
          if (nearby.has(author)) return

          return Option({
            notifications: Math.random() > 0.7 ? Math.floor(Math.random()*9+1) : 0, // TODO
            imageEl: api.about.html.avatar(author),
            label: api.about.obs.name(author),
            selected: location.feed === author,
            location: Object.assign({}, msg, { feed: author }) // TODO make obs?
          })
        }
      })
    }

    function LevelTwoContext () {
      const { key, value, feed: targetUser, page } = location
      const root = get(value, 'content.root', key)
      if (!targetUser) return

      var threads = MutantArray()

      pull(
        next(api.feed.pull.private, {reverse: true, limit: 100, live: false}, ['value', 'timestamp']),
        pull.filter(msg => msg.value.content.recps),
        pull.filter(msg => msg.value.content.recps
          .map(recp => typeof recp === 'object' ? recp.link : recp)
          .some(recp => recp === targetUser)
        ),
        api.feed.pull.rollup(),
        pull.drain(thread => threads.push(thread))
      )

      return h('div.level.-two', [
        Option({
          selected: page === 'threadNew',
          location: {page: 'threadNew', feed: targetUser},
          label: h('Button', strings.threadNew.action.new),
        }),
        map(threads, thread => { 
          return Option({
            label: api.message.html.subject(thread),
            selected: thread.key === root,
            location: Object.assign(thread, { feed: targetUser }),
          })
        }, { comparer: (a, b) => a === b })
      ])
    }

    function Option ({ notifications = 0, imageEl, label, location, selected }) {
      const className = selected ? '-selected' : '' 
      const goToLocation = (e) => {
        e.preventDefault()
        e.stopPropagation()
        api.history.sync.push(resolve(location))
      }

      if (!imageEl) {
        return h('Option', { className, 'ev-click': goToLocation }, [
          h('div.label', label)
        ])
      }

      return h('Option', { className }, [
        h('div.circle', [
          when(notifications, h('div.alert', notifications)),
          imageEl
        ]),
        h('div.label', { 'ev-click': goToLocation }, label)
      ])
    }
  })
}


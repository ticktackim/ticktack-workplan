const nest = require('depnest')
const { h, computed, map, when, Dict, dictToCollection, Array: MutantArray, Value, resolve } = require('mutant')
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
  var recentMsgCache = MutantArray()
  var usersMsgCache = Dict() // { id: [ msgs ] }

  return nest('app.html.context', context)
  
  function context (location) {
    const strings = api.translations.sync.strings()
    const myKey = api.keys.sync.id()

    var nearby = api.sbot.obs.localPeers()

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
          location: computed(recentMsgCache, recent => {
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
        filter: () => pull(
          pull.filter(msg => msg.value.content.type === 'post'), // TODO is this the best way to protect against votes?
          pull.filter(msg => msg.value.author != myKey),
          pull.filter(msg => msg.value.content.recps)
        ),
        store: recentMsgCache,
        updateTop: updateRecentMsgCache,
        updateBottom: updateRecentMsgCache,
        render: (msgObs) => {
          const msg = resolve(msgObs)
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

      function updateRecentMsgCache (soFar, newMsg) {
        soFar.transaction(() => { 
          const { author, timestamp } = newMsg.value
          const index = indexOf(soFar, (msg) => author === resolve(msg).value.author)
          var object = Value()

          if (index >= 0) {
            // reference already exists, lets use this instead!
            const existingMsg = soFar.get(index)

            if (resolve(existingMsg).value.timestamp > timestamp) return 
            // but abort if the existing reference is newer

            object = existingMsg
            soFar.deleteAt(index)
          }

          object.set(newMsg)

          const justOlderPosition = indexOf(soFar, (msg) => timestamp > resolve(msg).value.timestamp)
          if (justOlderPosition > -1) {
            soFar.insert(object, justOlderPosition)
          } else {
            soFar.push(object)
          }
        })
      }

    }

    function LevelTwoContext () {
      const { key, value, feed: targetUser, page } = location
      const root = get(value, 'content.root', key)
      if (!targetUser) return


      const prepend = Option({
        selected: page === 'threadNew',
        location: {page: 'threadNew', feed: targetUser},
        label: h('Button', strings.threadNew.action.new),
      })

      var userMsgCache = usersMsgCache.get(targetUser)
      if (!userMsgCache) {
        userMsgCache = MutantArray()
        usersMsgCache.put(targetUser, userMsgCache)
      }

      return api.app.html.scroller({
        classList: [ 'level', '-two' ],
        prepend,
        stream: api.feed.pull.private,
        filter: () => pull(
          pull.filter(msg => !msg.value.content.root), // only show the root message??? - check this still works with lastmessage
          pull.filter(msg => msg.value.content.type === 'post'), // TODO is this the best way to protect against votes?
          pull.filter(msg => msg.value.content.recps),
          pull.filter(msg => msg.value.content.recps
            .map(recp => typeof recp === 'object' ? recp.link : recp)
            .some(recp => recp === targetUser)
          )
        ),
        store: userMsgCache,
        updateTop: updateUserMsgCache,
        updateBottom: updateUserMsgCache,
        render: (rootMsgObs) => { 
          const rootMsg = resolve(rootMsgObs)
          return Option({
            label: api.message.html.subject(rootMsg),
            selected: rootMsg.key === root,
            location: Object.assign(rootMsg, { feed: targetUser }),
          })
        }
      })

      function updateUserMsgCache (soFar, newMsg) {
        soFar.transaction(() => { 
          const { timestamp } = newMsg.value
          const index = indexOf(soFar, (msg) => timestamp === resolve(msg).value.timestamp)

          if (index >= 0) return
          // if reference already exists, abort

          var object = Value(newMsg)

          const justOlderPosition = indexOf(soFar, (msg) => timestamp > resolve(msg).value.timestamp)
          if (justOlderPosition > -1) {
            soFar.insert(object, justOlderPosition)
          } else {
            soFar.push(object)
          }
        })
      }
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
  }
}

function indexOf (array, fn) {
  for (var i = 0; i < array.getLength(); i++) {
    if (fn(array.get(i))) {
      return i
    }
  }
  return -1
}

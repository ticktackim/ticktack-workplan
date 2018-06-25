const nest = require('depnest')
const { h, computed, map, when, Dict, Array: MutantArray, Value, Set, resolve } = require('mutant')
const pull = require('pull-stream')
const get = require('lodash/get')
const merge = require('lodash/merge')
const isEmpty = require('lodash/isEmpty')
const path = require('path')

exports.gives = nest({
  'app.html.sideNav': true,
  'unread.sync.markUnread': true
})

exports.needs = nest({
  'app.html.scroller': 'first',
  'app.obs.pluginsOk': 'first',
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'feed.pull.private': 'first',
  'history.sync.push': 'first',
  'history.obs.store': 'first',
  'keys.sync.id': 'first',
  'message.html.subject': 'first',
  'message.sync.getParticipants': 'first',
  'sbot.obs.localPeers': 'first',
  'translations.sync.strings': 'first',
  'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  var recentMsgCache = MutantArray()
  var usersLastMsgCache = Dict() // { id: [ msgs ] }
  var unreadMsgsCache = Dict() // { id: [ msgs ] }

  return nest({
    // intercept markUnread and remove them from the cache.
    'unread.sync.markUnread': markUnread,
    'app.html.sideNav': sideNav
  })

  function markUnread (msg) {
    unreadMsgsCache.get(msg.value.content.root || msg.key)
      .delete(msg.key)

    const participants = api.message.sync.getParticipants(msg)
    unreadMsgsCache.get(participants.key)
      .delete(msg.key)
  }

  function sideNav (location) {
    if (!isSideNavDiscovery(location)) return

    const strings = api.translations.sync.strings()
    var nearby = api.sbot.obs.localPeers()
    const getParticipants = api.message.sync.getParticipants
    const myKey = api.keys.sync.id()

    // Unread message counts
    function updateCache (cache, msg) {
      if (api.unread.sync.isUnread(msg)) { cache.add(msg.key) } else { cache.delete(msg.key) }
    }

    function updateUnreadMsgsCache (msg) {
      if (msg.value.author === myKey) return

      const participantsKey = getParticipants(msg).key
      updateCache(getUnreadMsgsCache(participantsKey), msg)

      const rootKey = get(msg, 'value.content.root', msg.key)
      updateCache(getUnreadMsgsCache(rootKey), msg)
    }

    // process messages for 'unreadness'
    pull(
      api.feed.pull.private(privateOpts({old: false, live: true})),
      pull.drain(updateUnreadMsgsCache)
    )
    pull(
      api.feed.pull.private(privateOpts({reverse: true, live: false})),
      pull.drain(updateUnreadMsgsCache)
    )

    return h('SideNav -discovery', [
      LevelOneSideNav(),
      LevelTwoSideNav()
    ])

    function LevelOneSideNav () {
      function isDiscoverLocation (loc) {
        const PAGES_UNDER_DISCOVER = ['blogIndex', 'blogShow', 'userShow']

        if (PAGES_UNDER_DISCOVER.includes(location.page)) return true
        if (location.page === 'threadNew') return false
        if (location.page === 'channelSubscriptions') return false
        if (get(location, 'value.private') === undefined) return true
        return false
      }

      const prepend = [
        // Nearby
        computed(nearby, n => !isEmpty(n) ? h('header', strings.peopleNearby) : null),
        map(nearby, feedId => Option({
          notifications: notifications(feedId),
          imageEl: api.about.html.avatar(feedId, 'small'),
          label: api.about.obs.name(feedId),
          selected: get(location, 'participants', []).join() === feedId && !isDiscoverLocation(location),
          location: computed(recentMsgCache, recent => {
            const lastMsg = recent.find(msg => msg.value.author === feedId)
            return lastMsg
              ? Object.assign(lastMsg, { participants: [feedId] })
              : { page: 'threadNew', participants: [feedId] }
          })
        }), { comparer: (a, b) => a === b }),

        // ---------------------
        computed(nearby, n => !isEmpty(n) ? h('hr') : null),

        // Discover
        Option({
          imageEl: h('i', [
            h('img', { src: path.join(__dirname, '../../../assets', 'discover.png') })
          ]),
          label: strings.blogIndex.title,
          selected: isDiscoverLocation(location),
          location: { page: 'blogIndex' }
        }),
        computed(api.app.obs.pluginsOk(), ok => {
          return [
            // My subscriptions
            Option({
              imageEl: h('i', [
                h('img', { src: path.join(__dirname, '../../../assets', 'my_subscribed.png') })
              ]),
              label: strings.subscriptions.user,
              selected: location.page === 'channelSubscriptions' && location.scope === 'user',
              disabled: !ok,
              location: { page: 'channelSubscriptions', scope: 'user' }
            }),

            // Friends subscriptions
            Option({
              imageEl: h('i', [
                h('img', { src: path.join(__dirname, '../../../assets', 'friends_subscribed.png') })
              ]),
              label: strings.subscriptions.friends,
              selected: location.page === 'channelSubscriptions' && location.scope === 'friends',
              disabled: !ok,
              location: { page: 'channelSubscriptions', scope: 'friends' }
            })
          ]
        })
      ]

      return api.app.html.scroller({
        classList: [ 'level', '-one' ],
        prepend,
        createStream: (opts) => api.feed.pull.private(privateOpts(opts)),
        store: recentMsgCache,
        updateTop: updateRecentMsgCache,
        updateBottom: updateRecentMsgCache,
        render
      })

      function render (msgObs) {
        const msg = resolve(msgObs)
        const participants = getParticipants(msg)
        // TODO msg has been decorated with a flat participantsKey, could re-hydrate

        if (participants.length === 1 && nearby.has(participants.key)) return
        const locParticipantsKey = get(location, 'participants', []).join(' ') // TODO collect logic

        if (participants.length === 1) {
          const author = participants[0]
          return Option({
            // the number of threads with each peer
            notifications: notifications(author),
            imageEl: api.about.html.avatar(author),
            label: api.about.obs.name(author),
            selected: locParticipantsKey === author,
            location: Object.assign({}, msg, { participants }) // TODO make obs?
          })
        } else {
          const rootMsg = get(msg, 'value.content.root', msg)
          return Option({
            // the number of threads with each peer
            notifications: notifications(participants),
            imageEl: participants.map(p => api.about.html.avatar(p, 'halfSmall')),
            label: api.message.html.subject(rootMsg),
            selected: locParticipantsKey === participants.key,
            location: Object.assign({}, msg, { participants }) // TODO make obs?
          })
        }
      }

      function updateRecentMsgCache (soFar, newMsg) {
        soFar.transaction(() => {
          const { timestamp } = newMsg.value
          newMsg.participants = getParticipants(newMsg)
          const index = indexOf(soFar, (msg) => newMsg.participants.key === resolve(msg).participants.key)
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

    function getUnreadMsgsCache (key) {
      var cache = unreadMsgsCache.get(key)
      if (!cache) {
        cache = Set()
        unreadMsgsCache.put(key, cache)
      }
      return cache
    }

    function notifications (key) {
      key = typeof key === 'string'
        ? key
        : key.key // participants.key case
      return computed(getUnreadMsgsCache(key), cache => cache.length)
    }

    function LevelTwoSideNav () {
      const { key, value, participants, page } = location
      const root = get(value, 'content.root', key)
      if (isEmpty(participants)) return
      if (page === 'userShow') return

      const prepend = Option({
        selected: page === 'threadNew',
        location: {page: 'threadNew', participants},
        label: h('Button', strings.threadNew.action.new)
      })

      var participantsKey = participants.join(' ') // TODO collect this repeated logic
      var userLastMsgCache = usersLastMsgCache.get(participantsKey)
      if (!userLastMsgCache) {
        userLastMsgCache = MutantArray()
        usersLastMsgCache.put(participantsKey, userLastMsgCache)
      }

      return api.app.html.scroller({
        classList: [ 'level', '-two' ],
        prepend,
        createStream: api.feed.pull.private,
        filter: () => pull(
          pull.filter(msg => !msg.value.content.root),
          pull.filter(msg => msg.value.content.type === 'post'),
          pull.filter(msg => getParticipants(msg).key === participantsKey)
        ),
        store: userLastMsgCache,
        updateTop: updateLastMsgCache,
        updateBottom: updateLastMsgCache,
        render
      })

      function render (rootMsgObs) {
        const rootMsg = resolve(rootMsgObs)
        const participants = getParticipants(rootMsg)
        return Option({
          notifications: notifications(rootMsg.key),
          label: api.message.html.subject(rootMsg),
          selected: rootMsg.key === root,
          location: Object.assign(rootMsg, { participants })
        })
      }

      function updateLastMsgCache (soFar, newMsg) {
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

    function Option ({ notifications = 0, imageEl, label, location, selected, disabled }) {
      const classList = []
      if (selected) classList.push('-selected')
      if (disabled) classList.push('-disabled')

      function goToLocation (e) {
        if (disabled) return

        e.preventDefault()
        e.stopPropagation()
        api.history.sync.push(resolve(location))
      }

      if (!imageEl) {
        return h('Option', { classList, 'ev-click': goToLocation }, [
          when(notifications, h('div.spacer', h('div.alert', notifications))),
          h('div.label', label)
        ])
      }

      return h('Option', { classList }, [
        h('div.circle', [
          when(notifications, h('div.alert', notifications)),
          Array.isArray(imageEl)
            ? h('div.many-images', imageEl.slice(0, 4)) // not ideal? not enough space to show more though
            : imageEl
        ]),
        h('div.label', { 'ev-click': goToLocation }, label)
      ])
    }

    function privateOpts (opts) {
      const defaultOpts = {
        query: [{
          $filter: {
            value: {
              content: {type: 'post'}
            }
          }
        }]
      }

      return merge({}, defaultOpts, opts)
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

function isSideNavDiscovery (location) {
  if (location.page) {
    if (location.page.match(/^blog/)) return true
    if (location.page.match(/^thread/)) return true
    if (location.page.match(/^user/)) return true
    if (location.page.match(/^channel/)) return true
  }
  if (location.key) {
    return true
  }
  return false
}

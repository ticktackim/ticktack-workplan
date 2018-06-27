const nest = require('depnest')
const pull = require('pull-stream')
const get = require('lodash/get')
const merge = require('lodash/merge')

exports.gives = nest('app.sync.initialize')

exports.needs = nest({
  'feed.pull.private': 'first',
  'keys.sync.id': 'first',
  'message.sync.getParticipants': 'first',
  'unread.sync.isUnread': 'first',
  'unread.obs.getUnreadMsgsCache': 'first'
})

exports.create = function (api) {
  return nest('app.sync.initialize', initialiseUnreadCounters)

  function initialiseUnreadCounters () {
    // process messages for 'unreadness'
    updateUnreadCounters()

    function updateUnreadCounters () {
      console.log('> initialising unread message counter watch')
      pull(
        api.feed.pull.private(privateOpts({old: false, live: true})),
        pull.drain(
          updateUnreadMsgsCache,
          () => console.error('  > unreadCounters live stream should not have ended!')
        )
      )
      pull(
        api.feed.pull.private(privateOpts({reverse: true, live: false})),
        pull.drain(
          updateUnreadMsgsCache,
          () => console.log('  > DONE - scan of past unread messages')
        )
      )
    }
  }

  function updateUnreadMsgsCache (msg) {
    if (msg.value.author === api.keys.sync.id()) return

    const { getUnreadMsgsCache } = api.unread.obs
    const { getParticipants } = api.message.sync

    const rootKey = get(msg, 'value.content.root', msg.key)
    updateCache(getUnreadMsgsCache(rootKey), msg)

    const participants = getParticipants(msg)
    if (participants) {
      updateCache(getUnreadMsgsCache(participants.key), msg)
    }
  }

  function updateCache (cache, msg) {
    if (api.unread.sync.isUnread(msg)) cache.add(msg.key)
    else cache.delete(msg.key)
  }
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

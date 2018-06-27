const nest = require('depnest')
const get = require('lodash/get')

exports.gives = nest('message.sync.getParticipants')

exports.needs = nest({
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  return nest('message.sync.getParticipants', getParticipants)

  function getParticipants (msg) {
    const recps = get(msg, 'value.content.recps')
    if (!recps) return

    const myKey = api.keys.sync.id()
    var participants = recps
      .map(r => typeof r === 'string' ? r : r.link)
      .filter(r => r !== myKey)
      .sort()

    if (!participants.length) participants = [msg.value.author]
    // if there's no recipient other than me, this could be a secret shard type message
    // where the author is not a recp!
    // OR it could be a message I sent only to myself

    participants.key = participants.join(' ')
    return participants
  }
}

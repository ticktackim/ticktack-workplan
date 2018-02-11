const nest = require('depnest')
const get = require('lodash/get')

exports.gives = nest('message.sync.getParticipants')

exports.needs = nest({
  'keys.sync.id': 'first',
})

exports.create = function (api) {
  return nest('message.sync.getParticipants', getParticipants)

  function getParticipants (msg) {
    const myKey = api.keys.sync.id()

    var participants = get(msg, 'value.content.recps')
      .map(r => typeof r === 'string' ? r : r.link)
      .filter(r => r != myKey)
      .sort()

    participants.key = participants.join(' ')
    return participants
  }
}




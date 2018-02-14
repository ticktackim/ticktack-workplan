const nest = require('depnest')
const { h, map, computed, when } = require('mutant')
const { intersection, difference } = require('lodash')

exports.gives = nest('contact.obs.relationships')

exports.needs = nest({
  'contact.obs.followers': 'first',
  'contact.obs.following': 'first',
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  return nest({
    'contact.obs.relationships': relationships
  })

  function relationships (id) {
    var following = api.contact.obs.following(id)
    var followers = api.contact.obs.followers(id)

    return computed([following, followers], (followingRaw, followersRaw) => {
      const friends = intersection([...followingRaw], [...followersRaw])
      const followers = difference(followersRaw, friends)
      const following = difference(followingRaw, friends)

      return { friends, followers, following }
    })
  }
}

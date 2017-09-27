const nest = require('depnest')
const { h, computed, map, when, Array: MutantArray } = require('mutant')
const pull = require('pull-stream')
const next = require('pull-next-step')

exports.gives = nest('app.html.context')

exports.needs = nest({
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'app.html.link': 'first',
  'feed.pull.private': 'first',
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first',
})


exports.create = (api) => {
  return nest('app.html.context', (location) => {

    const strings = api.translations.sync.strings()
    const myKey = api.keys.sync.id()

    const discover = {
      notifications: Math.floor(Math.random()*5+1),
      imageEl: h('i.fa.fa-binoculars'),
      name: strings.blogIndex.title,
      location: { page: 'blogIndex' },
      selected: ['blogIndex', 'home'].includes(location.page)
    }
    var nearby = []

    var recentPeersContacted = MutantArray([])

    pull(
      next(api.feed.pull.private, {reverse: true, limit: 100, live: false}, ['value', 'timestamp']),
      // filterUpThrough(),
      pull.filter(msg => msg.value.content.recps),
      pull.drain(msg => {
        msg.value.content.recps
          .map(recp => typeof recp === 'object' ? recp.link : recp)
          .filter(recp => recp != myKey)
          .forEach(recp => {
            if (!recentPeersContacted.includes(recp))
              recentPeersContacted.push(recp)
          })
      })
    )

    return h('Context -feed', [
      h('div.level.-one', [
        Option(discover), 
        map(nearby, Option), // TODO
        map(recentPeersContacted, key => Option({
          notifications: Math.random() > 0.7 ? Math.floor(Math.random()*9+1) : 0, // TODO
          imageEl: api.about.html.image(key), // TODO make avatar
          name: api.about.obs.name(key),
          location: { page: 'userShow', feed: key },
          selected: location.feed === key
        }))
      ]),
      // h('div.level.-two'),
    ])


    function Option ({ notifications = 0, imageEl, name, location, selected }) {
      return h('Option', { className: selected ? '-selected' : '' }, [
        h('div.circle', [
          when(notifications, h('div.alert', notifications)),
          imageEl
        ]),
        api.app.html.link(location, name),
      ])
    }
  })
}


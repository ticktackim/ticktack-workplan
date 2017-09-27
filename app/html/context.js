const nest = require('depnest')
const { h, computed, map, when } = require('mutant')

exports.gives = nest('app.html.context')

exports.needs = nest({
  'app.html.link': 'first',
  'translations.sync.strings': 'first',
})


exports.create = (api) => {
  return nest('app.html.context', (location) => {

    const strings = api.translations.sync.strings()

    const discover = {
      notification: 1,
      imageEl: h('i.fa.fa-binoculars'),
      name: strings.blogIndex.title,
      location: { page: 'blogIndex' },
      selected: location.page === 'blogIndex' // TODO could be a whole host of pages
    }

    const nearby = []
    const friendsWithThreads = []

    return h('Context -feed', [
      h('div.level.-one', [
        Option(discover), 
        map(nearby, Option), // TODO
        map(friendsWithThreads, Option) // TODO
      ]),
      // h('div.level.-two'),
    ])


    function Option ({ notification = 0, imageEl, name, location, selected }) {
      return h('Option', { className: selected ? '-selected' : '' }, [
        h('div.circle', [
          when(notification, h('div.alert', notification)),
          imageEl
        ]),
        api.app.html.link(location, name),
      ])
    }
  })
}


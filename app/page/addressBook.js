const nest = require('depnest')
const { h, Value, computed, map } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.page.addressBook')

// declare consts to avoid magic-string errors
const FRIENDS = 'friends'
const FOLLOWING = 'following'
const FOLLOWERS = 'followers'
const SEARCH = 'search'

exports.needs = nest({
  'about.html.avatar': 'first',
  'about.async.suggest': 'first',
  'about.obs.name': 'first',
  'app.html.topNav': 'first',
  // 'app.html.scroller': 'first',
  'app.html.sideNav': 'first',
  'app.html.topNav': 'first',
  'contact.html.follow': 'first',
  'contact.obs.relationships': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest('app.page.addressBook', function (location) {
    // location here can expected to be: { page: 'addressBook'}

    const strings = api.translations.sync.strings()
    const myKey = api.keys.sync.id()
    const relationships = api.contact.obs.relationships(myKey)

    const SECTIONS = [FRIENDS, FOLLOWING, FOLLOWERS, SEARCH]
    const section = location.section || FRIENDS
    if (!SECTIONS.includes(section)) throw new Error('AddressBook location must include valid section, got:', location)

    const input = Value()

    const suggester = api.about.async.suggest()
    const users = computed([relationships, input], (relationships, input) => {
      if (section === SEARCH) { return suggester(input) } else {
        const sectionRels = relationships[section]
        if (!input) {
          return sectionRels // show all e.g. friends
            .reverse()
            .map(id => { return { id, title: api.about.obs.name(id) } })
        } else { // show suggestions, and filter just the ones we want e.g. friends
          return suggester(input, relationships.followers)  // add extraIds to suggester
            .filter(user => sectionRels.includes(user.id))
        }
      }
    })

    const goTo = (loc) => () => api.history.sync.push(loc)

    return h('Page -addressBook', [
      api.app.html.sideNav(location, relationships),
      h('Scroller.content', [
        h('section.top', [
          api.app.html.topNav(location, input)
        ]),
        h('section.content', [
          h('div.results', map(users, user => {
            return h('div.result', { 'ev-click': goTo({page: 'userShow', feed: user.id}) }, [
              api.about.html.avatar(user.id),
              h('div.alias', user.title),
              // h('pre.key', user.id),
              api.contact.html.follow(user.id)
            ])
          }))
        ])
      ])
    ])
  })
}

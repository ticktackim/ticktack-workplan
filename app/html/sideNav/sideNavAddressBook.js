const nest = require('depnest')
const { h, computed } = require('mutant')

exports.gives = nest({
  'app.html.sideNav': true
})

exports.needs = nest({
  // 'app.html.scroller': 'first',
  // 'about.html.avatar': 'first',
  // 'about.obs.name': 'first',
  // 'feed.pull.private': 'first',
  'history.sync.push': 'first',
  // 'message.html.subject': 'first',
  // 'sbot.obs.localPeers': 'first',
  'translations.sync.strings': 'first'
  // 'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  return nest({
    'app.html.sideNav': sideNav
  })

  function sideNav (location, relationships) {
    if (location.page !== 'addressBook') return
    if (!location.section) location.section = 'friends'

    const strings = api.translations.sync.strings().addressBook
    const goTo = (loc) => () => api.history.sync.push(loc)

    // TODO - show local peers?
    // var nearby = api.sbot.obs.localPeers()

    return h('SideNav -addressBook', [
      LevelOneSideNav()
    ])

    function LevelOneSideNav () {
      return h('div.level.-one', [
        h('section', [
          SectionOption('search', [
            h('Button -primary', {}, strings.action.addUser)
          ]),
          h('hr')
        ]),

        // Friends
        h('section', [
          h('header', strings.heading.people),
          SectionOption('friends'),
          SectionOption('following'),
          SectionOption('followers')
        ])
      ])
    }

    function SectionOption (section, body) {
      const className = section === location.section
        ? '-selected'
        : ''
      return h('Option',
        { className, 'ev-click': goTo({page: 'addressBook', section }) },
        body || defaulBody(section)
      )

      function defaulBody (section) {
        return [
          h('i.fa.fa-angle-right'),
          strings.section[section],
          h('div.count', count(section))
        ]
      }
    }

    function count (relationshipType) {
      return computed(relationships, rels => rels[relationshipType].length)
    }
  }
}

const nest = require('depnest')
const { h, computed } = require('mutant')

exports.gives = nest({
  'app.html.sideNav': true
})

exports.needs = nest({
  'history.sync.push': 'first',
  'translations.sync.strings': 'first'
})

const SECTIONS = ['comments', 'likes', 'shares']

const ICONS = {
  stats: 'bar-chart',
  comments: 'commenting-o',
  likes: 'heart-o',
  shares: 'share-alt'
}

exports.create = (api) => {
  return nest({
    'app.html.sideNav': sideNav
  })

  function sideNav (location) {
    if (location.page !== 'statsShow' && location.page !== 'notifications') return
    if (location.page === 'notifications' && !SECTIONS.includes(location.section)) return

    const strings = api.translations.sync.strings()
    const goTo = (loc) => () => api.history.sync.push(loc)

    return h('SideNav -notifications', [
      LevelOneSideNav()
    ])

    function LevelOneSideNav () {
      return h('div.level.-one', [
        h('section', [
          h('Option',
            {
              className: location.page === 'statsShow' ? '-selected' : '',
              'ev-click': goTo({page: 'statsShow'})
            },
            [
              h('i.fa', { className: `fa-${ICONS['stats']}` }),
              strings['stats']
            ]
          ),
          SECTIONS.map(section => SectionOption(section))
        ])
      ])
    }

    function SectionOption (section) {
      return h('Option',
        {
          className: location.section === section ? '-selected' : '',
          'ev-click': goTo({page: 'notifications', section})
        },
        [
          h('i.fa', { className: `fa-${ICONS[section]}` }),
          strings[section]
        ]
      )
    }
  }
}

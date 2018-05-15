const nest = require('depnest')
const { h, computed, when } = require('mutant')
const path = require('path')
const { remote } = require('electron')

exports.gives = nest('app.html.header')
exports.needs = nest({
  'app.obs.pluginsOk': 'first'
})

const SETTINGS_PAGES = [
  'settings',
  'userEdit'
]

exports.create = (api) => {
  return nest('app.html.header', (nav) => {
    const { location, push } = nav

    const loc = computed(location, location => {
      if (typeof location !== 'object') return {}
      return location
    })

    if (loc().page === 'splash') return

    const isSettings = computed(loc, loc => SETTINGS_PAGES.includes(loc.page))
    const isAddressBook = computed(loc, loc => loc.page === 'addressBook')
    const isNotifications = computed(loc, loc => loc.page === 'notifications' || loc.page === 'statsShow')
    const isFeed = computed([isAddressBook, isSettings, isNotifications], (p, s, n) => !p && !s && !n)

    return h('Header', [
      windowControls(),
      h('nav', [
        h('i.feed', [
          h('img', {
            src: when(isFeed, assetPath('feed_on.png'), assetPath('feed.png')),
            'ev-click': () => push({page: 'blogIndex'})
          })
        ]),
        h('i.addressBook', [
          h('img', {
            src: when(isAddressBook, assetPath('address_bk_on.png'), assetPath('address_bk.png')),
            'ev-click': () => push({page: 'addressBook'})
          })
        ]),
        h('i.settings', [
          h('img.settings', {
            src: when(isSettings, assetPath('settings_on.png'), assetPath('settings.png')),
            'ev-click': () => push({page: 'settings'})
          })
        ]),
        computed(api.app.obs.pluginsOk(), ok => {
          return h('i.notifications.fa', {
            classList: [
              when(isNotifications, 'fa-bell', 'fa-bell-o'),
              when(!ok, '-disabled')
            ],
            'ev-click': () => {
              if (!ok) return
              push({page: 'statsShow'})
            }
          })
        })
      ])
    ])
  })

  function windowControls () {
    if (process.platform === 'darwin') return

    const window = remote.getCurrentWindow()
    const minimize = () => window.minimize()
    const maximize = () => {
      if (!window.isMaximized()) window.maximize()
      else window.unmaximize()
    }
    const close = () => window.close()

    return h('div.window-controls', [
      h('img.min', {
        src: assetPath('minimize.png'),
        'ev-click': minimize
      }),
      h('img.max', {
        src: assetPath('maximize.png'),
        'ev-click': maximize
      }),
      h('img.close', {
        src: assetPath('close.png'),
        'ev-click': close
      })
    ])
  }
}

function assetPath (name) {
  return path.join(__dirname, '../../assets', name)
}

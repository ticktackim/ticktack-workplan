const nest = require('depnest')
const { h, computed, when } = require('mutant')
const electron = require('electron')
const path = require('path')
const { version } = require('../../package.json')

exports.gives = nest('app.page.settings')

exports.needs = nest({
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'about.obs.description': 'first',
  'history.sync.push': 'first',
  'history.obs.store': 'first',
  'keys.sync.id': 'first',
  'message.html.markdown': 'first',
  'settings.sync.get': 'first',
  'settings.sync.set': 'first',
  'settings.obs.get': 'first',
  'translations.sync.strings': 'first',
  'backup.html.exportIdentityButton': 'first',
  'backup.html.importIdentityButton': 'first'

})

const LANGUAGES = ['zh', 'en']

exports.create = (api) => {
  return nest('app.page.settings', settings)

  function settings(location) {
    // RESET the app when the settings are changed
    api.settings.obs.get('language')(() => {
      console.log('language changed, resetting view')

      // clear history back to start page
      api.history.obs.store().set([
        { page: 'blogIndex' }
      ])
      api.history.sync.push({ page: 'settings' })
    })

    const webSharingMetricsOption = api.settings.obs.get('ticktack.websharemetrics')
    const feed = api.keys.sync.id()
    const strings = api.translations.sync.strings()
    const currentLanguage = api.settings.sync.get('language')
    const exportIdentityButton = api.backup.html.exportIdentityButton()
    const importIdentityButton = api.backup.html.importIdentityButton()

    const editProfile = () => api.history.sync.push({
      page: 'userEdit',
      feed,
      callback: (err, didEdit) => {
        if (err) throw new Error('Error editing profile', err)
        api.history.sync.push({ page: 'settings' })
      }
    })

    return h('Page -settings', [
      h('div.content', [
        h('h1', strings.settingsPage.title),
        h('section -avatar', [
          h('div.left'),
          h('div.right', api.about.html.image(feed))
        ]),
        h('section -name', [
          h('div.left', strings.settingsPage.section.name),
          h('div.right', [
            api.about.obs.name(feed),
            h('img', {
              src: path.join(__dirname, '../../assets', 'edit.png'),
              'ev-click': editProfile
            })
            // h('i.fa.fa-pencil', { 'ev-click': editProfile })
          ])
        ]),
        h('section -introduction', [
          h('div.left', strings.settingsPage.section.introduction),
          h('div.right', computed(api.about.obs.description(feed), d => api.message.html.markdown(d || '')))
        ]),
        h('section -language', [
          h('div.left', strings.settingsPage.section.language),
          h('div.right', LANGUAGES.map(Language))
        ]),
        h('section -zoom', [
          h('div.left', strings.settingsPage.section.zoom),
          h('div.right', [zoomButton(-0.1, '-'), zoomButton(+0.1, '+')])
        ]),
        h('section -theme', [
          h('div.left', strings.settingsPage.section.theme),
          h('div.right', ['light', 'dark'].map(Theme))
        ]),
        h('section -sharing', [
          h('div.left', strings.share.settings.caption),
          h('div.right', [].concat(
            webSharingOption('public', strings.share.settings.publicOption),
            webSharingOption('author', strings.share.settings.authorAndYouOption),
            webSharingOption('private', strings.share.settings.justYouOption)
          ))
        ]),
        h('section -version', [
          h('div.left', strings.settingsPage.section.version),
          h('div.right', version)
        ]),
        h('h1', ""),
        h('section -backup', [
          h('div.left', 'Backup'),
          h('div.right', [
            exportIdentityButton,
            importIdentityButton
          ])
        ])
      ])
    ])

    function Language(lang) {
      const selectLang = () => api.settings.sync.set({ language: lang })
      const className = currentLanguage === lang ? '-strong' : ''

      return h('Button -language',
        {
          'ev-click': () => selectLang(lang),
          className
        },
        strings.languages[lang]
      )
    }

    function Theme(theme) {
      const currentTheme = api.settings.obs.get('ticktack.theme')
      const className = computed(currentTheme, t => t === theme ? '-strong' : '')

      return h('Button -language',
        {
          'ev-click': () => currentTheme.set(theme),
          className
        },
        strings.themes[theme]
      )
    }

    function zoomButton(increment, symbol) {
      const { getCurrentWebContents } = electron.remote
      return h('Button -zoom',
        {
          'ev-click': () => {
            var zoomFactor = api.settings.sync.get('ticktack.electron.zoomFactor', 1)
            var newZoomFactor = zoomFactor + increment
            api.settings.sync.set('ticktack.electron.zoomFactor', newZoomFactor)
            getCurrentWebContents().setZoomFactor(newZoomFactor)
          }
        },
        symbol
      )
    }

    function webSharingOption(v, label) {
      let myOption = computed(webSharingMetricsOption, opt => opt === v)

      const selectWebSharingOption = () => {
        webSharingMetricsOption.set(v)
      }

      return h('Button -websharingmetrics',
        {
          'ev-click': () => selectWebSharingOption(v),
          className: when(myOption, '-strong', '')
        },
        label
      )
    }
  }
}

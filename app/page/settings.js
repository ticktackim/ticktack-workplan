const nest = require('depnest')
const { h, computed } = require('mutant')
const electron = require('electron')
const path = require('path')

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
})

const LANGUAGES = ['zh', 'en']

// TODO - this needs moving somewhere upstream
// const DEFAULT_SETTINGS = {
//   onboarded: false,
//   language: 'zh'
// }

exports.create = (api) => {
  return nest('app.page.settings', settings)

  function settings (location) {

    // RESET the app when the settings are changed
    api.settings.obs.get('language')(() => {
      console.log('language changed, resetting view')

      // clear history back to start page
      api.history.obs.store().set([
        { page: 'blogIndex' }
      ])
      api.history.sync.push({page: 'settings'})
    })

    const feed = api.keys.sync.id()
    const strings = api.translations.sync.strings()
    const currentLanguage = api.settings.sync.get('language')

    const editProfile = () => api.history.sync.push({
      page: 'userEdit',
      feed,
      callback: (err, didEdit) => {
        if (err) throw new Error ('Error editing profile', err)
        api.history.sync.push({ page: 'settings' })
      }
    }) 

    return h('Page -settings', [
      h('div.content', [
        h('h1', strings.settingsPage.title),
        h('section -avatar', [
          h('div.left'),
          h('div.right', api.about.html.image(feed)),
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
          ]),
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
          h('div.right', [ zoomButton(-0.1, '-'), zoomButton(+0.1, '+') ])
        ]),
      ])
    ])

    function Language (lang) {
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

    function zoomButton (increment, symbol) {
      const { getCurrentWebContents } = electron.remote
      return h('Button -zoom', 
        { 
          'ev-click': () => {
            var zoomFactor = api.settings.sync.get('ticktack.electron.zoomFactor', 1)
            var newZoomFactor = zoomFactor + increment
            var zoomFactor = api.settings.sync.set('ticktack.electron.zoomFactor', newZoomFactor)
            getCurrentWebContents().setZoomFactor(newZoomFactor)
          }
        }, 
        symbol
      )
    }
  }
}


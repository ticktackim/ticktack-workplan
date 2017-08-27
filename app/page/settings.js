const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.settings')

exports.needs = nest({
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'settings.sync.get': 'first',
  'settings.sync.set': 'first',
  'settings.obs.get': 'first',
  'translations.sync.strings': 'first',
})

const LANGUAGES = ['zh', 'en']
const DEFAULT_SETTINGS = {
  language: 'zh'
}

exports.create = (api) => {
  return nest('app.page.settings', settings)

  function settings (location) {
    // RESET the app when the settings are changed
    api.settings.obs.get()(() => {
      window.location.reload()
    })

    const feed = api.keys.sync.id()
    const strings = api.translations.sync.strings()
    const currentLanguage = api.settings.sync.get('language')

    return h('Page -settings', [
      h('div.container', [
        h('h1', strings.settingsPage.title),
        h('section -profile', [
          h('header', strings.settingsPage.section.profile),
          h('div.profile', [
            h('div.name', api.about.obs.name(feed)),
            api.about.html.image(feed),
          ]),
          h('div.actions', [
            h('Button', { 'ev-click': () => api.history.sync.push({page:'userEdit', feed}) }, [
              strings.settingsPage.action.edit,
              h('i.fa.fa-pencil')
            ])
          ])
        ]),
        h('section -language', [
          h('header', strings.settingsPage.section.language),
          h('div.languages', LANGUAGES.map(Language))
        ])
      ])
    ])

    function Language (lang) {
      const selectLang = () => api.settings.sync.set({ language: lang })
      const className = currentLanguage === lang ? '-primary' : '' 

      return h('Button -language', 
        { 
          'ev-click': () => selectLang(lang), 
          className 
        }, 
        lang
      )
    }

  }
}


const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.settings')

exports.needs = nest({
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

    const strings = api.translations.sync.strings()
    const currentLanguage = api.settings.sync.get('language')

    function Language (lang) {
      const selectLang = () => api.settings.sync.set({ language: lang })
      const className = currentLanguage === lang ? '-primary' : '' 

      return h('div.language', { 'ev-click': () => selectLang(lang) },
        h('Button', { className }, lang)
      )
    }

    return h('Page -settings', [
      h('div.container', [
        h('h1', strings.settings),
        h('div.languages', LANGUAGES.map(Language))
      ])
    ])
  }
}


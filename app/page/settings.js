const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.settings')

exports.needs = nest({
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'history.sync.push': 'first',
  'history.obs.store': 'first',
  'keys.sync.id': 'first',
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
      page:'userEdit',
      feed,
      callback: (err, didEdit) => {
        if (err) throw new Error ('Error editing profile', err)
        api.history.sync.push({ page: 'settings' })
      }
    }) 

    return h('Page -settings', [
      h('div.content', [
        h('h1', strings.settingsPage.title),
        h('section -profile', [
          h('header', strings.settingsPage.section.profile),
          h('div.profile', [
            h('div.name', api.about.obs.name(feed)),
            api.about.html.image(feed),
          ]),
          h('div.actions', [
            h('Button', { 'ev-click': editProfile }, [
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
      const className = currentLanguage === lang ? '-strong' : '' 

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


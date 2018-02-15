const nest = require('depnest')
const { h, watch } = require('mutant')

exports.gives = nest('app.html.warning')

exports.needs = nest({
  'app.html.lightbox': 'first',
  'app.obs.pluginsOk': 'first',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  var seenWarning = false

  return nest('app.html.warning', function warning () {
    if (seenWarning) return 

    const t = api.translations.sync.strings().pluginsOk

    const lightbox = api.app.html.lightbox(
      h('div', [
        h('h1', t.heading),
        h('p', t.description),
        h('p', t.advice),
        h('Button', {
          'ev-click': () => {
            lightbox.close() 
            seenWarning = true
          }},
          t.action.ok
        )
      ])
    )

    watch(
      api.app.obs.pluginsOk(),
      isOk => {
        if (isOk === false) lightbox.open()
      }
    )

    return lightbox
  })
}


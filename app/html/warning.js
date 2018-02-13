const nest = require('depnest')
const { h, onceTrue } = require('mutant')

exports.gives = nest('app.html.warning')

exports.needs = nest({
  'app.html.lightbox': 'first',
  'app.obs.pluginWarnings': 'first',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  var seenWarning = false

  return nest('app.html.warning', function warning () {
    if (seenWarning) return 

    const t = api.translations.sync.strings().pluginWarnings

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

    onceTrue(
      api.app.obs.pluginWarnings(),
      shouldWarn => {
        shouldWarn ? lightbox.open() : null
      }
    )

    return lightbox
  })
}


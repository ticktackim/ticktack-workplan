const nest = require('depnest')
const { h, onceTrue } = require('mutant')

exports.gives = nest('app.html.warning')

exports.needs = nest({
  'app.html.lightbox': 'first',
  'app.obs.pluginWarnings': 'first'
})

exports.create = (api) => {
  var seenWarning = false

  return nest('app.html.warning', function warning () {
    if (seenWarning) return 

    const lightbox = api.app.html.lightbox(
      h('div', [
        h('h1', 'Ticktack running in limited mode'),
        h('p', 'Another scuttlebutt app is managing your shared database. Core functionality will work, but you may find there are some features that do not work.'),
        h('p', 'If you are running Patchwork, close Patchwork before running Ticktack to get the full set of features'),
        h('Button', {
          'ev-click': () => {
            lightbox.close() 
            seenWarning = true
          }},
          'okay'
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


const nest = require('depnest')

exports.gives = nest('router.sync.routes')

exports.needs = nest({
  'app.page.home': 'first',
  'app.page.group': 'first'
})

exports.create = (api) => {
  return nest('router.sync.routes', (sofar = []) => {
    const { home, group, channel } = api.app.page

    // route format: [ routeValidator, routeFunction ]
    const routes = [
      [ ({ page }) => page === 'home', home ],
      [ ({ type }) => type === 'group', group ]
      [ ({ page }) => page === 'channel', channel ]
    ]

    return [...sofar, ...routes]
  })
}


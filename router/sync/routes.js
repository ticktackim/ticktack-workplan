const nest = require('depnest')
const isEmpty = require('lodash/isEmpty')

exports.gives = nest('router.sync.routes')

exports.needs = nest({
  'app.page.home': 'first',
  'app.page.group': 'first',
  'app.page.private': 'first'
})

exports.create = (api) => {
  return nest('router.sync.routes', (sofar = []) => {
    const { home, group, private } = api.app.page

    // route format: [ routeValidator, routeFunction ]
    const routes = [
      [ ({ page }) => page === 'home', home ],
      [ ({ type }) => type === 'group', group ],
      [ ({ key }) => !isEmpty(key), private ],
    ]

    return [...routes, ...sofar]
  })
}

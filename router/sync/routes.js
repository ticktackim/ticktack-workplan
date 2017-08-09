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
    const { home, group, channel, private: privatePage } = api.app.page

    // route format: [ routeValidator, routeFunction ]
    const routes = [
      [ location => location.page === 'home', home ],
      [ location => location.type === 'group', group ],
      [ location => !isEmpty(location.key), privatePage ]
    ]

    return [...routes, ...sofar]
  })
}








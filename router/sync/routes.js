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
    const pages = api.app.page
    // route format: [ routeValidator, routeFunction ]
    const routes = [
      [ location => location.page === 'home', pages.home ],
      [ location => location.type === 'group', pages.group ],
      [ location => location.page === 'channel', pages.channel ],
      [ location => !isEmpty(location.key), pages.privatePage ]
    ]

    return [...routes, ...sofar]
  })
}










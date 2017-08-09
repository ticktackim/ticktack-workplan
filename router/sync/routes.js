const nest = require('depnest')
const isEmpty = require('lodash/isEmpty')
const ref = require('ssb-ref')
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
    console.log('LOCATION', location, isEmpty(location.key))
    const routes = [
      [ location => location.page === 'home', pages.home ],
      [ location => location.type === 'group', pages.group ],
      [ location => location.page === 'channel', pages.channel ],
      [ location => ref.isMsg(location.key), pages.private ]
    ]

    return [...routes, ...sofar]
  })
}











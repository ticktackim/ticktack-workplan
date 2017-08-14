const nest = require('depnest')
const { isMsg, isFeed } = require('ssb-ref')
exports.gives = nest('router.sync.routes')

exports.needs = nest({
  'app.page.error': 'first',
  'app.page.home': 'first',
  'app.page.channel': 'first',
  'app.page.settings': 'first',
  'app.page.groupFind': 'first',
  'app.page.groupIndex': 'first',
  'app.page.groupNew': 'first',
  'app.page.groupShow': 'first',
  'app.page.userFind': 'first',
  'app.page.userShow': 'first',
  'app.page.threadShow': 'first'
})

exports.create = (api) => {
  return nest('router.sync.routes', (sofar = []) => {
    const pages = api.app.page
    // route format: [ routeValidator, routeFunction ]
 
    const routes = [
      [ location => location.page === 'home', pages.home ],
      [ location => location.channel , pages.channel ],
      [ location => location.page === 'settings', pages.settings ],

      // Group pages
      [ location => location.page === 'groupFind', pages.groupFind ],
      [ location => location.page === 'groupIndex', pages.groupIndex ],
      [ location => location.page === 'groupNew', pages.groupNew ],
      [ location => location.type === 'groupShow' && isMsg(location.key), pages.groupShow ],

      // User pages
      [ location => location.page === 'userFind', pages.userFind ],
      [ location => isFeed(location.feed), pages.userShow ],

      // Thread pages
      // QUESTION - should this be for private threads + group threads?
      [ location => isMsg(location.key), pages.threadShow ],

      // Error page
      [ location => true, pages.error ]
    ]

    return [...routes, ...sofar]
  })
}












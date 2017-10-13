const nest = require('depnest')
const { isMsg, isFeed, isBlob } = require('ssb-ref')
const openExternal = require('open-external')
const get = require('lodash/get')

exports.gives = nest('router.sync.routes')

exports.needs = nest({
  'app.page.error': 'first',
  'app.page.blogIndex': 'first',
  'app.page.blogNew': 'first',
  'app.page.settings': 'first',
  // 'app.page.channel': 'first',
  // 'app.page.groupFind': 'first',
  // 'app.page.groupIndex': 'first',
  // 'app.page.groupNew': 'first',
  // 'app.page.groupShow': 'first',
  'app.page.userEdit': 'first',
  // 'app.page.userFind': 'first',
  // 'app.page.userShow': 'first',
  'app.page.threadNew': 'first',
  'app.page.threadShow': 'first',
  // 'app.page.image': 'first',
  'blob.sync.url': 'first',
})

exports.create = (api) => {
  return nest('router.sync.routes', (sofar = []) => {
    const pages = api.app.page
    // route format: [ routeValidator, routeFunction ]

    const routes = [

      // Thread pages
      // [ location => location.page === 'threadNew' && location.channel, pages.threadNew ],
      [ location => location.page === 'threadNew' && isFeed(location.feed), pages.threadNew ],
      [ location => isMsg(location.key), pages.threadShow ],

      // User pages
      // [ location => location.page === 'userFind', pages.userFind ],
      [ location => location.page === 'userEdit' && isFeed(location.feed), pages.userEdit ],
      // [ location => isFeed(location.feed), pages.userShow ],

      // Group pages
      // [ location => location.page === 'groupFind', pages.groupFind ],
      // [ location => location.page === 'groupIndex', pages.groupIndex ],
      // [ location => location.page === 'groupNew', pages.groupNew ],
      // // [ location => location.type === 'groupShow' && isMsg(location.key), pages.groupShow ],
      // [ location => location.channel , pages.channel ],

      // Blog pages
      [ location => location.page === 'home', pages.blogIndex ],
      [ location => location.page === 'discovery', pages.blogIndex ],
      [ location => location.page === 'blogIndex', pages.blogIndex ],
      [ location => location.page === 'blogNew', pages.blogNew ],

      [ location => location.page === 'settings', pages.settings ],

      // [ location => isBlob(location.blob), pages.image ],
      [ location => isBlob(location.blob), (location) => {
        openExternal(api.blob.sync.url(location.blob))
      }],

      // Error page
      [ location => true, pages.error ]
    ]

    return [...routes, ...sofar]
  })
}


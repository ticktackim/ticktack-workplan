const nest = require('depnest')
const { isMsg, isFeed, isBlob } = require('ssb-ref')
const openExternal = require('open-external')
const get = require('lodash/get')

exports.gives = nest('router.sync.routes')

exports.needs = nest({
  'app.page.error': 'first',
  'app.page.addressBook': 'first',
  'app.page.blogIndex': 'first',
  'app.page.blogNew': 'first',
  'app.page.blogSearch': 'first',
  'app.page.blogShow': 'first',
  'app.page.settings': 'first',
  'app.page.channelSubscriptions': 'first',
  'app.page.channelShow': 'first',
  'app.page.notifications': 'first',
  // 'app.page.channel': 'first',
  // 'app.page.groupFind': 'first',
  // 'app.page.groupIndex': 'first',
  // 'app.page.groupNew': 'first',
  // 'app.page.groupShow': 'first',
  'app.page.userEdit': 'first',
  // 'app.page.userFind': 'first',
  'app.page.userShow': 'first',
  'app.page.splash': 'first',
  'app.page.statsShow': 'first',
  'app.page.threadNew': 'first',
  'app.page.threadShow': 'first',
  // 'app.page.image': 'first',
  'blob.sync.url': 'first'
})

exports.create = (api) => {
  return nest('router.sync.routes', (sofar = []) => {
    const pages = api.app.page
    // route format: [ routeValidator, routeFunction ]

    const routes = [
      [ location => location.page === 'splash', pages.splash ],

      // Blog pages
      [ location => location.page === 'blogIndex', pages.blogIndex ],
      [ location => location.page === 'blogNew', pages.blogNew ],
      [ location => location.page === 'blogSearch', pages.blogSearch ],
      [ location => location.page === 'blogShow', pages.blogShow ],
      [ location => isMsg(location.key) && get(location, 'value.content.type') === 'blog', pages.blogShow ],
      [ location => {
        return isMsg(location.key) &&
          get(location, 'value.content.type') === 'post' &&
          !get(location, 'value.private') // treats public posts as 'blogs'
      }, pages.blogShow ],

      // Channel related pages
      [ location => location.page === 'channelSubscriptions', pages.channelSubscriptions ],
      [ location => location.page === 'channelShow', pages.channelShow ],
      [ location => location.channel, pages.channelShow ],

      // Stats / Notifications pages
      [ location => location.page === 'statsShow', pages.statsShow ],
      [ location => location.page === 'notifications', pages.notifications ],

      // AddressBook pages
      [ location => location.page === 'addressBook', pages.addressBook ],

      // Private Thread pages
      // [ location => location.page === 'threadNew' && location.channel, pages.threadNew ],
      [ location => location.page === 'threadNew' && location.participants.every(isFeed), pages.threadNew ],
      [ location => isMsg(location.key), pages.threadShow ],

      // User pages
      // [ location => location.page === 'userFind', pages.userFind ],
      [ location => location.page === 'userEdit' && isFeed(location.feed), pages.userEdit ],
      [ location => isFeed(location.feed), pages.userShow ],

      // Group pages
      // [ location => location.page === 'groupFind', pages.groupFind ],
      // [ location => location.page === 'groupIndex', pages.groupIndex ],
      // [ location => location.page === 'groupNew', pages.groupNew ],
      // // [ location => location.type === 'groupShow' && isMsg(location.key), pages.groupShow ],
      // [ location => location.channel , pages.channel ],

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

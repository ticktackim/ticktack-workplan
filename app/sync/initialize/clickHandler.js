const nest = require('depnest')

exports.gives = nest('app.sync.initialize')

exports.needs = nest({
  'app.async.catchLinkClick': 'first',
  'app.sync.nav': 'first',
})

exports.create = (api) => {
  return nest({
    'app.sync.initialize': function initializeClickHandling () {
      api.app.async.catchLinkClick(document.body, (link, { isExternal }) => {
        const nav = api.app.sync.nav()

        if (isExternal) return openExternal(link)
        nav.push(link)
      })
    }
  })
}

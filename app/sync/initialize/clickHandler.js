const nest = require('depnest')

exports.gives = nest('app.sync.initialize')

exports.needs = nest({
  'app.async.catchLinkClick': 'first',
  'history.sync.push': 'first',
})

exports.create = (api) => {
  return nest({
    'app.sync.initialize': function initializeClickHandling () {
      const target = document.body

      api.app.async.catchLinkClick(target, (link, { isExternal }) => {
        if (isExternal) return openExternal(link)

        api.history.sync.push(link)
      })
    }
  })
}


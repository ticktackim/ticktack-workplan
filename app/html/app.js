const nest = require('depnest')

exports.gives = nest('app.html.app')

exports.needs = nest({
  'app.sync.initialize': 'map',
  'app.sync.nav': 'first'
})

exports.create = (api) => {
  return nest({
    'app.html.app': function app () {
      api.app.sync.initialize()

      return api.app.sync.nav()
    }
  })
}


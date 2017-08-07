const nest = require('depnest')

exports.gives = nest('app.html.app')

exports.needs = nest({
  'app.sync.goTo': 'first'
})

exports.create = (api) => {
  return nest('app.html.app', app)

  function app () {
    return api.app.sync.goTo({ page: 'home' })
  }
}

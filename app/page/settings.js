const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.settings')

exports.needs = nest({
  'app.html.nav': 'first'
})

exports.create = (api) => {
  return nest('app.page.settings', settings)

  function settings (location) {

    return h('Page -settings', [
      h('h1', 'Settings'),
      api.app.html.nav(),
    ])
  }
}

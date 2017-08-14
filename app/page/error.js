const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.error')

exports.needs = nest({
  'app.html.nav': 'first'
})

exports.create = (api) => {
  return nest('app.page.error', error)

  function error (location) {

    return h('Page -error', [
      h('h1', 'Error'),
      api.app.html.nav(),
      "The route wasn't found of there was an error",
      location.error
    ])
  }
}

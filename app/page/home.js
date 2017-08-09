const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.home')

exports.needs = nest({
  'app.html.nav': 'first'
})

exports.create = (api) => {
  return nest('app.page.home', home)

  function home (location) {
    // location here can expected to be: { page: 'home' }

    return h('Page -home', [
      h('h1', 'Home'),
      api.app.html.nav(),
    ])
  }
}

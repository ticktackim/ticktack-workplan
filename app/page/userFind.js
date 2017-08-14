const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.userFind')

exports.needs = nest({
  'app.html.nav': 'first'
})

exports.create = (api) => {
  return nest('app.page.userFind', userFind)

  function userFind (location) {

    return h('Page -userFind', [
      h('h1', 'Find a User'),
      api.app.html.nav()
    ])
  }
}

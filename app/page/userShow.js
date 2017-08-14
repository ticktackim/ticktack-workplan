const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.userShow')

exports.needs = nest({
  'app.html.nav': 'first'
})

exports.create = (api) => {
  return nest('app.page.userShow', userShow)

  function userShow (location) {

    return h('Page -userShow', [
      h('h1', 'User show'),
      api.app.html.nav(),
      h('p', `key: ${location.key}`)
    ])
  }
}

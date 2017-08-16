const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.groupFind')

exports.needs = nest({
  'translations.sync.strings': 'first',
  'app.html.nav': 'first'
})

exports.create = (api) => {
  var strings = api.translations.sync.strings()
  return nest('app.page.groupFind', groupFind)

  function groupFind (location) {
    return h('Page -groupFind', {title: strings.groupFind}, [
      h('p', `key: ${location.key}`)
    ])
  }
}



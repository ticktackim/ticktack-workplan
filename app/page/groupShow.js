const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.groupShow')

exports.needs = nest({
  'translations.sync.strings': 'first',
  'app.html.nav': 'first'
})

exports.create = (api) => {
  var strings = api.translations.sync.strings()
  return nest('app.page.groupShow', groupShow)

  function groupShow (location) {
    // location here can be the root message of a group : { type: 'group', key }
    // TODO show specific group index described by key

    return h('Page -groupShow', {title: strings.groupShow}, [
      h('p', `key: ${location.key}`)
    ])
  }
}





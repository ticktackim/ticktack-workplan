const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.groupIndex')

exports.needs = nest({
  'translations.sync.strings': 'first',
  'app.html.nav': 'first'
})

exports.create = (api) => {
  var strings = api.translations.sync.strings()
  return nest('app.page.groupIndex', groupIndex)

  function groupIndex (location) {
    return h('Page -groupIndex', {title: strings.groupIndex}, [
      strings.stub
    ])
  }
}




const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.groupNew')

exports.needs = nest({
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest('app.page.groupNew', groupNew)
  var strings = api.translations.sync.strings()
  function groupNew (location) {
    return h('Page -groupNew', {title: strings.groupNew}, [
      strings.stub
    ])
  }
}




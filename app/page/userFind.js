const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.userFind')

exports.needs = nest({
  'translations.sync.strings': 'first',
  'app.html.nav': 'first'
})

exports.create = (api) => {
  var strings = api.translations.sync.strings()
  return nest('app.page.userFind', userFind)

  function userFind (location) {

    return h('Page -userFind', {title: strings.userFind}, [
      string.stub
    ])
  }
}




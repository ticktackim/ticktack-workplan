const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.error')

exports.needs = nest({
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  var strings = api.translations.sync.strings()

  return nest('app.page.error', error)

  function error (location) {
    return h('Page -error', {title: strings.error}, [
      strings.errorNotFound,
      h('pre', [JSON.stringify(location, null, 2)])
    ])
  }
}


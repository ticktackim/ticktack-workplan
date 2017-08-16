const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.settings')

exports.needs = nest({
  'translations.sync.strings': 'first',
})

exports.create = (api) => {
  return nest('app.page.settings', settings)

  function settings (location) {

    return h('Page -settings', {title: strings.settings}, [
      strings.stub
    ])
  }
}




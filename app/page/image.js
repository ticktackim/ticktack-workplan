const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.image')

exports.needs = nest({
  'translations.sync.strings': 'first',
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'app.html.thread': 'first',
  'blob.sync.url': 'first'
})

exports.create = (api) => {
  var strings = api.translations.sync.strings()

  return nest('app.page.image', function (location) {
    return h('Page -image', [
      h('div.container', [
        h('img', {src: api.blob.sync.url(location.blob || location)})
      ])
    ])
  })
}










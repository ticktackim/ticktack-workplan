const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.threadNew')

exports.needs = nest({
  'translations.sync.strings': 'first',
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'app.html.nav': 'first',
  'app.html.thread': 'first',
})

exports.create = (api) => {
  var strings = api.translations.sync.strings()

  return nest('app.page.threadNew', threadNew)

  function threadNew (location) {
    const { feed } = location

    return h('Page -threadNew', {title: strings.threadNew}, [
      h('h1', ['New thread with ', api.about.obs.name(feed)]),
      api.about.html.image(feed),
      h('div', 'compose box') // a special one which takes us to threadShow
    ])
  }
}




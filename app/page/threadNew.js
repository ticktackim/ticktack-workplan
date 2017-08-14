const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.threadNew')

exports.needs = nest({
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'app.html.nav': 'first',
  'app.html.thread': 'first',
})

exports.create = (api) => {
  return nest('app.page.threadNew', threadNew)

  function threadNew (location) {
    const { feed } = location

    return h('Page -threadNew', [
      h('h1', ['New thread with ', api.about.obs.name(feed)]),
      api.about.html.image(feed),
      api.app.html.nav(),
      h('div', 'compose box') // a special one which takes us to threadShow
    ])
  }
}

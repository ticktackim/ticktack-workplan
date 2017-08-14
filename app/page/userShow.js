const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.userShow')

exports.needs = nest({
  'app.html.link': 'first',
  'app.html.nav': 'first',
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'keys.sync.id': 'first',
})

exports.create = (api) => {
  return nest('app.page.userShow', userShow)

  function userShow (location) {

    const { feed } = location
    const Link = api.app.html.link
    const myId = api.keys.sync.id()

    return h('Page -userShow', [
      h('h1', api.about.obs.name(feed)),
      api.app.html.nav(),
      api.about.html.image(feed),
      h('div', 'follow button'),
      h('div', 'friends in common'),
      feed !== myId
        ? Link({ page: 'threadNew', feed }, 'New Thread')
        : '',
      h('div', 'conversations you\'ve had with dominic'),
      h('div', 'groups dominic is in'),
    ])
  }
}

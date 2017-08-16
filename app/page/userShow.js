const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.userShow')

exports.needs = nest({
  'translations.sync.strings': 'first',
  'app.html.link': 'first',
  'app.html.nav': 'first',
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'keys.sync.id': 'first',
})

exports.create = (api) => {
  var strings = api.translations.sync.strings()

  return nest('app.page.userShow', userShow)

  function userShow (location) {

    const { feed } = location
    const Link = api.app.html.link
    const myId = api.keys.sync.id()
    var name = api.about.html.name(feed)

    return h('Page -userShow', {title: api.about.obs.name(feed)}, [
      api.about.html.image(feed),
      h('div', strings.followButton),
      h('div', strings.friendsInCommon),
      feed !== myId
        ? Link({ page: 'threadNew', feed }, strings.newThread)
        : '',
      h('div', strings.userConvesationsWith, name),
      h('div', name, strings.userIsInGroups),
    ])
  }
}




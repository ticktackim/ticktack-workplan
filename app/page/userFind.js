const nest = require('depnest')
const { h, Value, computed, map } = require('mutant')

exports.gives = nest('app.page.userFind')

exports.needs = nest({
  'about.html.image': 'first',
  'app.html.link': 'first',
  'about.async.suggest': 'first',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest('app.page.userFind', userFind)

  function userFind (location) {
    const strings = api.translations.sync.strings()
    const input = Value()

    const suggester = api.about.async.suggest()
    const users = computed(input, input => suggester(input))

    const Link = api.app.html.link

    return h('Page -userFind', {title: strings.userFind.pageTitle}, [
      h('div.content', [
        h('div.search', [
          h('i.fa.fa-search'),
          h('input', {
            placeholder: strings.userFind.action.findAUser,
            autofocus: 'autofocus',
            'ev-input': e => input.set(e.target.value)
          })
        ]),
        h('div.results', map(users, user => {
          return Link({ feed: user.id },
            h('div.result', [
              api.about.html.image(user.id),
              h('div.alias', user.title),
              h('pre.key', user.id)
            ])
          )
        }))
      ])
    ])
  }
}

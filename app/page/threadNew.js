const nest = require('depnest')
const { h, Struct, Value, Array: MutantArray, computed, map } = require('mutant')

exports.gives = nest('app.page.threadNew')

exports.needs = nest({
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'app.html.sideNav': 'first',
  'app.html.thread': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'message.html.compose': 'first',
  'translations.sync.strings': 'first',
})

exports.create = (api) => {

  return nest('app.page.threadNew', threadNew)

  function threadNew (location) {
    const { feed, channel } = location

    if (feed) return threadNewFeed(location)
  }

  function threadNewFeed (location) {
    const strings = api.translations.sync.strings()
    const myId = api.keys.sync.id()

    const { feed } = location
    const name = api.about.obs.name

    const searchInput = Value()
    const meta = Struct({
      type: 'post',
      recps: MutantArray ([
        myId,
        { link: feed, name: name(feed) }
      ]),
      subject: Value()
    })

    const composer = api.message.html.compose(
      { meta, shrink: false },
      (err, msg) => api.history.sync.push(err ? err : Object.assign(msg, { feed })) // TODO check this
    )

    return h('Page -threadNew', {title: strings.threadNew.pageTitle}, [
      api.app.html.sideNav(location),
      h('div.content', [
        h('div.container', [
          h('div.field -to', [
            h('div.label', strings.threadNew.field.to),
            h('div.recps', [
              map(meta.recps, Recipient),
              h('input', {
                'ev-input': e => searchInput.set(e.target.value),
                placeholder: strings.optionalField
              }),
            ])
          ]),
          h('div.field -subject', [
            h('div.label', strings.threadNew.field.subject),
            h('input', {
              'ev-input': e => meta.subject.set(e.target.value),
              placeholder: strings.optionalField
            }),
          ]),
          composer
        ])
      ])
    ])

    function Recipient (r) {
      if (r === myId) return

      return h('div.recp', [
        api.about.html.avatar(r.link, 'tiny'),
        h('div.name', r.name)
      ])
    }
  }

}


const nest = require('depnest')
const { h, Struct, Value, computed } = require('mutant')

exports.gives = nest('app.page.threadNew')

exports.needs = nest({
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'app.html.context': 'first',
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
    // if (channel) return threadNewChannel(location)
  }

  function threadNewFeed (location) {
    const strings = api.translations.sync.strings()

    const { feed } = location
    const name = api.about.obs.name(feed)

    const meta = Struct({
      type: 'post',
      recps: [
        api.keys.sync.id(),
        { link: feed, name }
      ],
      subject: Value()
    })
    const composer = api.message.html.compose(
      { meta, shrink: false },
      (err, msg) => api.history.sync.push(err ? err : Object.assign(msg, { feed }))
    )

    return h('Page -threadNew', {title: strings.threadNew.pageTitle}, [
      api.app.html.context(location),
      h('div.content', [
        h('div.field -to', [
          h('div.label', strings.threadNew.field.to),
          h('div.recps', [
            h('div.recp', [
              api.about.html.image(feed),
              h('div.name', name)
            ])
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
  }

  // function threadNewChannel (location) {
  //   const strings = api.translations.sync.strings()

  //   const { channel, flash } = location

  //   const meta = Struct({
  //     type: 'post',
  //     channel,
  //     subject: Value()
  //   })
  //   const composer = api.message.html.compose(
  //     { meta, shrink: false },
  //     (err, msg) => api.history.sync.push(err ? err : msg)
  //   )

  //   return h('Page -threadNew', {title: strings.threadNew.pageTitle}, [
  //     h('div.content', [
  //       flash ? h('div.flash', flash) : '',
  //       h('div.field -channel', [
  //         h('div.label', strings.threadNew.field.channel),
  //         h('div.recps', [
  //           h('div.recp', [
  //             h('div.name', `#${channel}`)
  //           ])
  //         ])
  //       ]),
  //       h('div.field -subject', [
  //         h('div.label', strings.threadNew.field.subject),
  //         h('input', {
  //           'ev-input': e => meta.subject.set(e.target.value),
  //           placeholder: strings.optionalField
  //         }),
  //       ]),
  //       composer
  //     ])
  //   ])
  // }
}


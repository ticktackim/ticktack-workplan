const nest = require('depnest')
const { h, Struct, Value } = require('mutant')

exports.gives = nest('app.page.blogNew')

exports.needs = nest({
  'app.html.context': 'first',
  // 'app.html.threadCard': 'first',
  'history.sync.push': 'first',
  // 'keys.sync.id': 'first',
  'message.html.compose': 'first',
  'translations.sync.strings': 'first',
  // 'state.obs.threads': 'first',
  // 'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  var contentHtmlObs

  return nest('app.page.blogNew', blogNew)
  
  function blogNew (location) {
    const strings = api.translations.sync.strings()

    const meta = Struct({
      type: 'blog',
      channel: Value(),
      title: Value(),
    })

    const composer = api.message.html.compose(
      { meta, shrink: false },
      (err, msg) => api.history.sync.push(err ? err : msg)
    )

    return h('Page -blogNew', [
      api.app.html.context(location),
      h('div.content', [
        h('div.field -channel', [
          h('div.label', strings.channel),
          h('input', {
            'ev-input': e => meta.title.set(e.target.value), // TODO - suggest-mention
            placeholder: strings.channel
          }),
        ]),
        h('div.field -title', [
          h('div.label', strings.blogNew.field.title),
          h('input', {
            'ev-input': e => meta.title.set(e.target.value),
            placeholder: strings.blogNew.field.title
          }),
        ]),
        composer
      ])
    ])
  }
}

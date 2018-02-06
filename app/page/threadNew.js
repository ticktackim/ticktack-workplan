const nest = require('depnest')
const { h, Struct, Value, Array: MutantArray, computed, map, resolve } = require('mutant')
const suggestBox = require('suggest-box')

exports.gives = nest('app.page.threadNew')

exports.needs = nest({
  'about.async.suggest': 'first',
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'app.html.sideNav': 'first',
  'app.html.thread': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'message.html.compose': 'first',
  'message.sync.unbox': 'first',
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

    const meta = Struct({
      type: 'post',
      recps: MutantArray ([
        myId,
        { link: feed, name: resolve(api.about.obs.name(feed)) }
      ]),
      subject: Value()
    })

    return h('Page -threadNew', {title: strings.threadNew.pageTitle}, [
      api.app.html.sideNav(location),
      h('div.content', [
        h('div.container', [
          h('div.field -to', [
            h('div.label', strings.threadNew.field.to),
            h('div.recps', [
              map(meta.recps, Recipient),
              RecipientInput(meta.recps)
            ])
          ]),
          h('div.field -subject', [
            h('div.label', strings.threadNew.field.subject),
            h('input', {
              'ev-input': e => meta.subject.set(e.target.value),
              placeholder: strings.optionalField
            }),
          ]),
          Composer(meta)
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

    function RecipientInput (recps) {
      const getRecpSuggestions = api.about.async.suggest()
      const input = h('input', {
        placeholder: strings.threadNew.action.addMoreRecps
        // 'ev-input': e => searchInput.set(e.target.value),
      })

      var boxActive = false
      addSuggest()

      input.addEventListener('suggestselect', (e) => {
        const { id, title: name } = e.detail
        if (!recps.find(r => r === id || r.link === id))
          recps.push({ link: id, name })

        boxActive = false
        e.target.value = ''
        e.target.placeholder = ''
      })

      input.addEventListener('keyup', (e) => {
        // don't pop the previous entry if still entering a name!
        if (boxActive) {
          // if you delete a name you were typing completely, mark box inactive
          // so that further deletes pop names
          if (e.target.value === '') boxActive = false
          return
        }

        if (e.code === 'Backspace' || e.key === 'Backspace' || e.keyCode == 8) {
          if (recps.getLength() < 3) return // can only delete down to 2 recps (sender + 1 recp)

          recps.pop()
        }
      })

      return input

      function addSuggest () {
        if (!input.parentElement) return setTimeout(addSuggest, 100)

        suggestBox(input, (inputText, cb) => {
          if (recps.getLength() >= 7) return
          // TODO - tell the user they're only allowed 6 (or 7?!) people in a message

          boxActive = true
          const suggestions = getRecpSuggestions(inputText)
          cb(null, suggestions)
        }, {cls: 'PatchSuggest'})
      }
    }

    function Composer (meta) {
      return api.message.html.compose(
        { meta, shrink: false },
        (err, msg) => {
          if (err) return api.history.sync.push(err)

          const someRecipient = meta.recps.get(1)
          if (!someRecipient) return

          api.history.sync.push(Object.assign(
            api.message.sync.unbox(msg), // for consistency of message sideNav receives D:
            { feed: someRecipient.link }
          ))
        }
      )
    }
  }

}


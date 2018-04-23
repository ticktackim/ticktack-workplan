var { h, computed, when, Value, resolve } = require('mutant')
var nest = require('depnest')

exports.needs = nest({
  'keys.sync.id': 'first',
  'message.obs.shares': 'first',
  'sbot.async.publish': 'first',
  'translations.sync.strings': 'first',
  'app.html.lightbox': 'first'
})

exports.gives = nest('message.html.shares')

exports.create = (api) => {
  return nest('message.html.shares', function shares(msg) {
    var id = api.keys.sync.id()
    var shares = api.message.obs.shares(msg.key)

    var iShared = computed(shares, shares => shares.includes(id))
    var count = computed(shares, shares => shares.length ? shares.length : '')
    var isOpen = Value(false)
    var strings = api.translations.sync.strings()
    var publishAndClose = (msg) => {
      publishShare(msg, resolve(captionRaw))
      isOpen.set(false)
    }

    var captionRaw = Value('')
    var captionInput = h('textarea#caption', {
      style: {
        width: '90%'
      },
      placeholder: 'Type an optional caption here',
      value: computed(captionRaw, t => t),
      'ev-input': () => captionRaw.set(captionInput.value),
    })

    var confirmationDialog = h('div.dialog', [
      h('div.message', [
        h('p', 'Do you to share this post with your followers?'),
      ]),
      h('div.form', [
        captionInput
      ]),
      h('div.actions', [
        h('Button', { 'ev-click': () => isOpen.set(false) }, strings.userShow.action.cancel),
        h('Button -primary', { 'ev-click': () => publishAndClose(msg, true) }, "Share")
      ])
    ])

    var lb = api.app.html.lightbox(confirmationDialog, isOpen)


    return h('Shares', { 'ev-click': () => isOpen.set(!iShared()) }, [
      h('i.fa', { className: when(iShared, 'fa-retweet', 'fa-retweet faint') }),
      h('div.count', count),
      lb
    ])
  })

  function publishShare(msg, text, status = true) {
    if (status) {
      var share = {
        type: 'share',
        share: { link: msg.key, content: "blog", text: text }
      }
      if (msg.value.content.recps) {
        share.recps = msg.value.content.recps.map(function (e) {
          return e && typeof e !== 'string' ? e.link : e
        })
        share.private = true
      }
      api.sbot.async.publish(share)
    }
  }
}

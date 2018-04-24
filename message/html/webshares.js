var { h, computed, when, Value, resolve } = require('mutant')
var nest = require('depnest')
var { clipboard, shell } = require('electron')

exports.needs = nest({
  'keys.sync.id': 'first',
  'message.obs.webshares': 'first',
  'sbot.async.publish': 'first',
  'translations.sync.strings': 'first',
  'app.html.lightbox': 'first'
})

exports.gives = nest('message.html.webshares')

exports.create = (api) => {
  return nest('message.html.webshares', function shares(msg) {
    var id = api.keys.sync.id()
    var shares = api.message.obs.webshares(msg.key)

    var iShared = computed(shares, shares => shares.includes(id))
    var count = computed(shares, shares => shares.length ? shares.length : '')
    var isOpen = Value(false)
    var strings = api.translations.sync.strings()
    var publishAndClose = (msg, action) => {
      publishShare(msg, action)
      isOpen.set(false)
    }
    var confirmationDialog = h('div.dialog', [
      h('div.message', [
        h('p', strings.share.externalShareLabel),
      ]),
      h('div.actions', [
        h('Button', { 'ev-click': () => isOpen.set(false) }, strings.userShow.action.cancel),
        h('Button', { style: { 'margin-left': '10px', 'margin-right': '10px' }, 'ev-click': () => publishAndClose(msg, 'copy') }, strings.share.action.copy),
        h('Button -primary', { 'ev-click': () => publishAndClose(msg, 'open') }, strings.share.action.open)

      ])
    ])

    var lb = api.app.html.lightbox(confirmationDialog, isOpen)


    return h('WebShares', { 'ev-click': () => isOpen.set(true) }, [
      h('i.fa', { className: when(iShared, 'fa-globe', 'fa-globe faint') }),
      h('div.count', count),
      lb
    ])
  })

  function publishShare(msg, action) {
    var url = `http://share2.ticktack.im:8807/${msg.key}`
    var share = {
      type: 'share',
      share: { link: msg.key, content: "blog", url: url }
    }
    if (msg.value.content.recps) {
      share.recps = msg.value.content.recps.map(function (e) {
        return e && typeof e !== 'string' ? e.link : e
      })
      share.private = true
    }
    api.sbot.async.publish(share)

    if (action == "copy") {
      console.log("copying to clipboard")
      clipboard.writeText(url)
    } else {
      console.log("opening external")
      shell.openExternal(url, err => console.log("error", err))
    }
  }
}

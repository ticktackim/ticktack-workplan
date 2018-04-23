var { h, computed, when } = require('mutant')
var nest = require('depnest')

exports.needs = nest({
  'keys.sync.id': 'first',
  'message.obs.shares': 'first',
  'sbot.async.publish': 'first'
})

exports.gives = nest('message.html.shares')

exports.create = (api) => {
  return nest('message.html.shares', function shares(msg) {
    var id = api.keys.sync.id()
    var shares = api.message.obs.shares(msg.key)

    var iShared = computed(shares, shares => shares.includes(id))
    var count = computed(shares, shares => shares.length ? shares.length : '')
    return h('Shares', { 'ev-click': () => publishShare(msg, !iShared()) }, [
      h('i.fa', { className: when(iShared, 'fa-retweet', 'fa-retweet faint') }),
      h('div.count', count)
    ])
  })

  function publishShare(msg, status = true) {
    if (status) {
      var share = {
        type: 'share',
        share: { link: msg.key, content: "blog", text: '' }
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

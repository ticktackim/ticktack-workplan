var { h, computed, when } = require('mutant')
var nest = require('depnest')

exports.needs = nest({
  'keys.sync.id': 'first',
  'message.obs.likes': 'first',
  'sbot.async.publish': 'first'
})

exports.gives = nest('message.html.likes')

exports.create = (api) => {
  return nest('message.html.likes', function likes(msg) {
    var id = api.keys.sync.id()
    var likes = api.message.obs.likes(msg.key)

    var iLike = computed(likes, likes => likes.includes(id))
    var count = computed(likes, likes => likes.length ? likes.length : '')

    return h('Likes', { 'ev-click': () => publishLike(msg, !iLike()) }, [
      h('i.fa', { className: when(iLike, 'fa-heart', 'fa-heart-o') }),
      h('div.count', count)
    ])
  })

  function publishLike(msg, status = true) {
    var like = status ? {
      type: 'vote',
      channel: msg.value.content.channel,
      vote: { link: msg.key, value: 1, expression: 'Like' }
    } : {
        type: 'vote',
        channel: msg.value.content.channel,
        vote: { link: msg.key, value: 0, expression: 'Unlike' }
      }
    if (msg.value.content.recps) {
      like.recps = msg.value.content.recps.map(function (e) {
        return e && typeof e !== 'string' ? e.link : e
      })
      like.private = true
    }
    api.sbot.async.publish(like)
  }
}

var { h, computed, throttle, when } = require('mutant')
var nest = require('depnest')

exports.needs = nest({
  'keys.sync.id': 'first',
  'message.obs.likes': 'first'
})

exports.gives = nest('message.html.commentsCount')

exports.create = (api) => {
  return nest('message.html.commentsCount', function commentsCount (thread) {
    var count = computed(throttle(thread.messages, 500), msgs => {
      return msgs
        .filter(msg => msg.value.content.root) // exclude root message / blog
        .filter(msg => {
          if (msg.value.content.type !== 'post') console.log(msg.value.content.type)
          return msg.value.content.type === 'post'
        })
        .length
    })

    return h('CommentsCount', [
      h('i.fa', { className: 'fa-commenting-o' }),
      h('div.count', when(count, count))
    ])
  })
}

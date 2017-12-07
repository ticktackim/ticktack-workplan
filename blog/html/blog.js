var pull = require('pull-stream')
var nest = require('depnest')
const h = require('mutant').h

exports.gives = nest({
  'blog.html.title': true,
  'blog.html.summary': true,
  'blog.html.thumbnail': true,
  'blog.html.content': true,
})

exports.needs = nest({
  'message.html.markdown': 'first',
  'sbot.pull.stream': 'first'
})


exports.create = function (api) {

  return nest({
    'blog.html.title': function (data) {
      if('blog' == typeof data.value.content.type) return
      return data.value.content.title
    },
    'blog.html.summary': function (data) {
      if('blog' == typeof data.value.content.type) return
      return data.value.content.summary
    },
    'blog.html.thumbnail': function (data) {
      if('blog' == typeof data.value.content.type) return
      return data.value.content.thumbnail
    },
    'blog.html.content': function (data) {
      if('blog' == typeof data.value.content.type) return
      var div = h('Markdown')
      pull(
        api.sbot.pull.stream(function (sbot) {
          return sbot.blobs.get(data.value.content.blog)
        }),
        pull.collect(function (err, ary) {
          if(err) return
          var md = api.message.html.markdown({text:Buffer.concat(ary).toString()})
          div.innerHTML = md.innerHTML
        })
      )
      return div
    }
  })
}






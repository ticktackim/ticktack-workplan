var marksum = require('markdown-summary')
var nest = require('depnest')

exports.gives = nest({
  'blog.html.title': true,
  'blog.html.summary': true,
  'blog.html.thumbnail': true,
  'blog.html.content': true,
})

exports.needs = nest({
  'message.html.markdown': 'first',
})

exports.create = function (api) {

  function fromPost(fn) {
    return function (data) {
      if('post' !== data.value.content.type) return
      return api.message.html.markdown ({text: fn(data.value.content)})
    }
  }

  return nest({
    'blog.html.title': fromPost(function (content) {
      return content.title || marksum.title(content.text)
    }),
    'blog.html.summary': fromPost(function (content) {
      return content.summary || marksum.summary(content.text)
    }),
    'blog.html.thumbnail': function (data) {
      if('post' !== data.value.content.type) return
      var content = data.value.content
      if(content.thumbnail) return content.thumbnail
      var img = marksum.image(content.text)
      var m = /\!\[[^]+\]\(([^\)]+)\)/.exec(img)
      if(m) return m[1]
    },
    'blog.html.content': fromPost(function (content) {
      return content.text
    })
  })
}



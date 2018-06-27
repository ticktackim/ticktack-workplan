var marksum = require('markdown-summary')
var nest = require('depnest')

exports.gives = nest({
  'blog.html.title': true,
  'blog.html.summary': true,
  'blog.html.thumbnail': true,
  'blog.html.content': true
})

exports.needs = nest({
  'message.html.markdown': 'first'
})

exports.create = function (api) {
  function fromPost (fn, innerText = false) {
    return function (data) {
      if (data.value.content.type !== 'post') return

      const md = api.message.html.markdown({text: fn(data.value.content)})
      return innerText ? md.innerText : md
    }
  }

  return nest({
    'blog.html.title': fromPost(content => {
      if (content.title) return content.title
      if (content.text) return marksum.title(content.text)
    }, true),
    'blog.html.summary': fromPost(content => {
      if (content.summary) return content.summary
      if (content.text) return marksum.summary(content.text)
    }),
    'blog.html.thumbnail': function (data) {
      const { type, thumbnail, text } = data.value.content
      if (type !== 'post') return
      if (thumbnail) return thumbnail

      if (text) {
        var img = marksum.image(text)
        var m = /\!\[[^]+\]\(([^\)]+)\)/.exec(img)
        if (m) return m[1]
      }
    },
    'blog.html.content': fromPost(content => content.text)
  })
}

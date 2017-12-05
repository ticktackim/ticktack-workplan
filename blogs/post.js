var marksum = require('markdown-summary')

//var markdown = require('ssb-markdown')


exports.gives = {
  message: {
    html: {
      title: true,
      summary: true,
      thumbnail: true,
      content: true
    }
  }
}

exports.needs = {
  message: { html: { markdown: 'first' } }
}


exports.create = function (api) {

  function render (source) {
    return markdown.block(source, {
      emoji: (emoji) => {
        return renderEmoji(emoji, api.emoji.sync.url(emoji))
      },
      toUrl: (id) => {
        if (ref.isBlob(id)) return api.blob.sync.url(id)
        return id
      },
      imageLink: (id) => id
    })
  }
  function fromPost(fn) {
    return function (data) {
      if('post' !== data.value.content.type) return
      return api.message.html.markdown ({text: fn(data.value.content)})
    }
  }

  return {
    message: {
      html: {
        title: fromPost(function (content) {
          return content.title || marksum.title(content.text)
        }),
        summary: fromPost(function (content) {
          return content.summary || marksum.summary(content.text)
        }),
        thumbnail: function (data) {
          if('post' !== data.value.content.type) return
          var content = data.value.content
          if(content.thumbnail) return content.thumbnail
          var img = marksum.image(content.text)
          var m = /\!\[[^]+\]\(([^\)]+)\)/.exec(img)
          if(m) return m[1]
        },
        content: fromPost(function (content) {
          return content.text
        })
      }
    }
  }
}




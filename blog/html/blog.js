const pull = require('pull-stream')
const nest = require('depnest')
const { h, onceTrue } = require('mutant')
const get = require('lodash/get')
const { isBlob } = require('ssb-ref')

exports.gives = nest({
  'blog.html.title': true,
  'blog.html.summary': true,
  'blog.html.thumbnail': true,
  'blog.html.content': true
})

exports.needs = nest({
  'message.html.markdown': 'first',
  'sbot.pull.stream': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  function loadBlob (data) {
    const { blog } = data.value.content
    if (!isBlob(blog)) {
      console.log(`malformed Blog blog: ${blog}`, data)
      return
    }

    onceTrue(
      api.sbot.obs.connection,
      sbot => sbot.blobs.want(blog, (err, success) => {
        if (err) throw err

        // console.log(`want blog ${blog}, callback: ${success}`)
      })
    )
  }

  return nest({
    'blog.html.title': function (data) {
      if (!isBlog(data)) return

      return data.value.content.title
    },
    'blog.html.summary': function (data) {
      if (!isBlog(data)) return

      loadBlob(data)
      return data.value.content.summary
    },
    'blog.html.thumbnail': function (data) {
      if (!isBlog(data)) return
      return data.value.content.thumbnail
    },
    'blog.html.content': function (data) {
      if (!isBlog(data)) return

      loadBlob(data)
      var div = h('Markdown')
      pull(
        api.sbot.pull.stream(function (sbot) {
          return sbot.blobs.get(data.value.content.blog)
        }),
        pull.collect(function (err, ary) {
          if (err) return
          var md = api.message.html.markdown({text: Buffer.concat(ary).toString()})
          div.innerHTML = md.innerHTML
        })
      )
      return div
    }
  })
}

function isBlog (msg) {
  return get(msg, 'value.content.type') === 'blog'
}

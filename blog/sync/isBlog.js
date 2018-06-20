const nest = require('depnest')
const isBlog = require('scuttle-blog/isBlog')

exports.gives = nest({
  'blog.sync.isBlog': true
})

const MIN_LENGTH_FOR_BLOG_POST = 2500

exports.create = function (api) {
  return nest({
    'blog.sync.isBlog': isBloggy
  })

  function isBloggy (msg) {
    // if (!isBlog(msg)) {
    //   console.log(isBlog.errors)
    //   console.log(JSON.stringify(msg.value.content, null, 2))
    //   console.log('')
    // }
    if (isBlog(msg)) return true

    const { type, text = '' } = msg.value.content
    if (type === 'post' && text.length > MIN_LENGTH_FOR_BLOG_POST) return true
    return false
  }
}

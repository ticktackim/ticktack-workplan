const nest = require('depnest')
const get = require('lodash/get')
const isBlog = require('scuttle-blog/isBlog')

exports.gives = nest({
  'blog.sync.isBlog': true
})

const MIN_LENGTH_FOR_BLOG_POST = 800

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

    const type = msg.value.content.type
    if (type === 'post' && get(msg, 'value.content.text', '').length > MIN_LENGTH_FOR_BLOG_POST) return true
    return false
  }
}

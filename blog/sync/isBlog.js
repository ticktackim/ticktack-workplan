const nest = require('depnest')
const get = require('lodash/get')

exports.gives = nest({
  'blog.sync.isBlog': true,
})

const MIN_LENGTH_FOR_BLOG_POST = 800

exports.create = function (api) {
  return nest({
    'blog.sync.isBlog': isBlog
  })

  function isBlog (msg) {
    const type = msg.value.content.type
    if (type === 'blog') return true
    if (type === 'post' && get(msg, 'value.content.text', '').length > MIN_LENGTH_FOR_BLOG_POST) return true
    return false
  }
}


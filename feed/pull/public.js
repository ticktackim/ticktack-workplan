const nest = require('depnest')
const merge = require('lodash/merge')
const pull = require('pull-stream')
pull.merge = require('pull-merge')
const next = require('pull-next-query')

exports.gives = nest('feed.pull.public')
exports.needs = nest({
  // 'message.sync.isBlocked': 'first',
  'sbot.pull.stream': 'first'
})

exports.create = function (api) {
  return nest('feed.pull.public', function (opts = {}) {
    const defaultBlogOpts = {
      limit: 100,
      query: [{
        $filter: {
          value: {
            timestamp: { $gt: 0 },
            content: { type: 'blog' }
          }
        }
      }]
    }

    const defaultPostOpts = {
      limit: 100,
      query: [{
        $filter: {
          value: {
            timestamp: { $gt: 0 },
            content: {
              type: 'post',
              root: { $is: 'undefined' }
            }
          }
        }
      }]
    }

    return api.sbot.pull.stream(server => {
      return pull.merge(
        next(server.query.read, merge({}, defaultBlogOpts, opts), ['value', 'timestamp']),
        next(server.query.read, merge({}, defaultPostOpts, opts), ['value', 'timestamp']),
        Comparer(opts)
      )
    })
  })
}

function Comparer (opts) {
  return (a, b) => {
    if (opts.reverse) {
      return a.value.timestamp > b.value.timestamp ? -1 : +1
    } else {
      return a.value.timestamp < b.value.timestamp ? -1 : +1
    }
  }
}

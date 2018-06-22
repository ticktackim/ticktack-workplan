const nest = require('depnest')
const merge = require('lodash/merge')
const pull = require('pull-stream')
const next = require('pull-next-query')

exports.gives = nest('feed.pull.private')
exports.needs = nest({
  'message.sync.isBlocked': 'first',
  'sbot.obs.connection': 'first',
  'sbot.pull.stream': 'first'
})

exports.create = function (api) {
  return nest('feed.pull.private', function (opts) {
    const defaultOpts = {
      query: [{
        $filter: {
          timestamp: { $gt: 0 }
          // value: {
          //   timestamp: { $gt: 0 }
          // }
        }
      }]
    }
    const _opts = merge({}, defaultOpts, opts)

    return api.sbot.pull.stream(server => {
      if (!server.private || !server.private.read) return pull.empty()

      return pull(
        // next(server.backlinks.read, _opts, ['value', 'timestamp']),
        next(server.private.read, _opts, ['timestamp']),
        // pull.through(console.log),
        pull.filter(msg => !api.message.sync.isBlocked(msg))
      )
    })
  })
}

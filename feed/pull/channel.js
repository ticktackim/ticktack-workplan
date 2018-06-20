const nest = require('depnest')
const merge = require('lodash/merge')
const pull = require('pull-stream')
const next = require('pull-next-query')

exports.gives = nest('feed.pull.channel')
exports.needs = nest({
  'channel.sync.normalize': 'first',
  'message.sync.isBlocked': 'first',
  'sbot.pull.stream': 'first'
})

exports.create = function (api) {
  return nest('feed.pull.channel', function (channel) {
    channel = api.channel.sync.normalize(channel)
    if (typeof channel !== 'string') throw new Error('a channel name be specified')

    return function (opts) {
      const defaultOpts = {
        query: [{
          $filter: {
            dest: `#${channel}`,
            rts: { $gt: 0 }
          }
        }]
      }
      const _opts = merge({}, defaultOpts, opts)

      return api.sbot.pull.stream(server => {
        return pull(
          next(server.backlinks.read, _opts, ['rts']),
          pull.filter(msg => !api.message.sync.isBlocked(msg))
        )
      })
    }

    // return function (opts) {
    //   const defaultOpts = {
    //     query: [{
    //       $filter: {
    //         value: {
    //           timestamp: { $gt: 0 },
    //           content: {
    //             channel,
    //             root: 'undefined'
    //           }
    //         }
    //       }
    //     }]
    //   }
    //   const _opts = merge({}, defaultOpts, opts)

    //   return api.sbot.pull.stream(server => {
    //     return pull(
    //       next(server.query.read, _opts, ['value', 'timestamp']),
    //       pull.filter(msg => !api.message.sync.isBlocked(msg))
    //     )
    //   })
    // }
  })
}

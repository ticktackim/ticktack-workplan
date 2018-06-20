const FlumeView = require('flumeview-level')
const get = require('lodash/get')
const clone = require('lodash/cloneDeep')
const pull = require('pull-stream')
const pullMerge = require('pull-merge')
const defer = require('pull-defer')
const isBlog = require('scuttle-blog/isBlog')
const { isMsg: isMsgRef } = require('ssb-ref')

const getType = (msg) => get(msg, 'value.content.type')
const getAuthor = (msg) => get(msg, 'value.author')
const getCommentRoot = (msg) => get(msg, 'value.content.root')
const getLikeRoot = (msg) => get(msg, 'value.content.vote.link')
const getShareRoot = (msg) => get(msg, 'value.content.share.link')
const getTimestamp = (msg) => get(msg, 'value.timestamp')

const FLUME_VIEW_VERSION = 1

module.exports = {
  name: 'ticktack',
  version: 1,
  manifest: {
    get: 'async',
    read: 'source',
    readBlogs: 'source',
    getBlogs: 'async',
    readComments: 'source',
    readAllComments: 'source',
    readAllLikes: 'source',
    readAllShares: 'source',
    readLikes: 'source',
    getPrivateMessages: 'source'
  },
  init: (server, config) => {
    console.log('> initialising ticktack plugin')
    const myKey = server.keys.id

    const view = server._flumeUse(
      'ticktack',
      FlumeView(FLUME_VIEW_VERSION, map)
    )

    return {
      get: view.get,
      read: view.read,
      readBlogs,
      getBlogs,
      readComments,
      readAllComments,
      readAllLikes,
      readAllShares,
      readLikes,
      // readShares
      getPrivateMessages
    }

    function map (msg, seq) {
      var root

      switch (getType(msg)) {
        case 'blog':
          if (isBlog(msg) && isMyMsg(msg)) return [['B', msg.key, getTimestamp(msg)]]
          else return []

        case 'vote':
          root = getLikeRoot(msg)
          // TODO figure out how to only store likes I care about
          if (root) return [['L', root, getTimestamp(msg)]]
          else return []

          // Note this catches:
          //   - all likes, on all things D:
          //   - likes AND unlikes

        case 'post':
          root = getCommentRoot(msg)
          // TODO figure out how to only store comments I care about
          if (!root && isMyMsg(msg) && isPlog(msg)) return [['B', msg.key, getTimestamp(msg)]]
          else if (root) return [['C', root, getTimestamp(msg)]]
          else return []

          // Note this catches:
          //   - all comments, on all things D:

        default:
          return []
      }
    }

    function readBlogs (options = {}) {
      const query = Object.assign({}, {
        gte: ['B', null, null],
        // null is the 'minimum' structure in bytewise ordering
        lte: ['B', undefined, undefined],
        reverse: true,
        values: true,
        keys: false,
        seqs: false
      }, options)

      return view.read(query)
    }

    function getBlogs (options, cb) {
      if (typeof options === 'function') {
        cb = options
        options = {}
      }

      pull(
        readBlogs(options),
        pull.collect(cb)
      )
    }

    function readComments (blog, options = {}) {
      var key = getBlogKey(blog)

      const query = Object.assign({}, {
        gt: ['C', key, null],
        lt: ['C', key, undefined],
        // undefined is the 'maximum' structure in bytewise ordering https://www.npmjs.com/package/bytewise#order-of-supported-structures
        reverse: true,
        values: true,
        keys: false,
        seqs: false
      }, options)

      return view.read(query)
    }

    function readLikes (blog, options = {}) {
      var key = getBlogKey(blog)

      const query = Object.assign({}, {
        gt: ['L', key, null],
        lt: ['L', key, undefined],
        reverse: true,
        values: true,
        keys: false,
        seqs: false
      }, options)

      return view.read(query)
    }

    function readAllComments (opts = {}) {
      return readAllSource({
        type: 'post',
        makeFilter: blogIds => msg => {
          if (getAuthor(msg) === myKey) return false // exclude my posts
          if (getCommentRoot(msg) === undefined) return false // want only 'comments' (reply posts)
            // NOTE - this one will get nested replies too

          return blogIds.includes(getCommentRoot(msg)) // is about one of my blogs
        },
        opts
      })
    }

    function readAllLikes (opts = {}) {
      return readAllSource({
        type: 'vote',
        makeFilter: blogIds => msg => {
          if (getAuthor(msg) === myKey) return false // exclude my likes

          return blogIds.includes(getLikeRoot(msg)) // is about one of my blogs
        },
        opts
      })
    }

    function readAllShares (opts = {}) {
      return readAllSource({
        type: 'share',
        makeFilter: (blogIds) => msg => {
          if (getAuthor(msg) === myKey) return false // exclude my shares

          return blogIds.includes(getShareRoot(msg)) // is about one of my blogs
        },
        opts
      })
    }

    function readAllSource ({ type, makeFilter, opts = {} }) {
      var source = defer.source()

      getBlogs({ keys: true, values: false }, (err, data) => {
        if (err) throw err

        const blogIds = data.map(d => d[1])

        opts.type = type
        var limit = opts.limit
        delete opts.limit
        // have to remove limit from the query otherwise Next stalls out if it doesn't get a new result

        const _source = pull(
          server.messagesByType(opts),      // TODO - check/ note why I didn't use e.g. readComments
          pull.filter(makeFilter(blogIds)),
          limit ? pull.take(limit) : true
        )

        source.resolve(_source)
      })

      return source
    }

    function isMyMsg (msg) {
      return getAuthor(msg) === myKey
    }

    function getPrivateMessages (authors, _opts = {}) {
      if (!authors.includes(server.id)) authors.push(server.id)

      const opts = clone(_opts)

      const lt = opts.lt
      delete opts.lt
      const gt = opts.gt
      delete opts.gt

      const limit = opts.limit
      delete opts.limit

      return pull(
        pullMerge(
          authors.map(author => {
            const finalOpts = Object.assign(clone(opts), {
              query: [{
                $filter: {
                  timestamp: {
                    $gt: typeof gt === 'number' ? gt : 0,
                    $lt: typeof lt === 'number' ? lt : 1e20
                  },
                  value: {
                    content: { type: 'post' },
                    author
                  }
                }
              }]
            })
            return server.private.read(finalOpts)
          }),
          Comparer(opts)
        ),
        pull.filter(Boolean),
        pull.filter(msg => !msg.sync),
        // pull.filter(msg => msg.value.content.type === 'post'),
        pull.filter(msg => {
          const recps = (msg.value.content.recps || [msg.value.content.recps])
            .filter(Boolean)
            .map(r => typeof r === 'string' ? r : r.link)
            .filter(Boolean)

          if (authors.length !== recps.length) return false
          return authors.every(r => recps.includes(r))
        }),
        limit ? pull.take(limit) : true
      )
    }
  }
}

function Comparer (opts) {
  return (a, b) => {
    if (opts.reverse) {
      return a.timestamp > b.timestamp ? -1 : +1
    } else {
      return a.timestamp < b.timestamp ? -1 : +1
    }
  }
}

function getBlogKey (blog) {
  if (isMsgRef(blog)) return blog
  // else if (isMsgRef(blog.key) && isBlog(blog)) return blog.key
  else if (isMsgRef(blog.key) && (isBlog(blog) || isPlog(blog))) return blog.key
}

// a Plog is a Blog shaped Post!
function isPlog (msg) {
  // if (get(msg, 'value.content.text', '').length >= 2500) console.log(get(msg, 'value.content.text', '').length)
  return get(msg, 'value.content.text', '').length >= 2500
}

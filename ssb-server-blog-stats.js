const FlumeView = require('flumeview-level')
const get = require('lodash/get')
const pull = require('pull-stream')
const isBlog = require('scuttle-blog/isBlog')
const { isMsg: isMsgRef } = require('ssb-ref')

const getType = (msg) => get(msg, 'value.content.type')
const getAuthor = (msg) => get(msg, 'value.author')
const getCommentRoot = (msg) => get(msg, 'value.content.root')
const getLikeRoot = (msg) => get(msg, 'value.content.vote.link')
const getTimestamp = (msg) => get(msg, 'value.timestamp')

const FLUME_VIEW_VERSION = 2

module.exports = {
  name: 'blogStats',
  version: 1,
  manifest: {
    get: 'async',
    read: 'source',
    readBlogs: 'source',
    getBlogs: 'async',
    readComments: 'source',
    readLikes: 'source'
  },
  init: (server, config) => {
    console.log('initialising blog-stats plugin')
    const myKey = server.keys.id

    const view = server._flumeUse(
      'internalblogStats',
      FlumeView(FLUME_VIEW_VERSION, map)
    )

    return {
      get: view.get,
      read: view.read,
      readBlogs,
      getBlogs,
      readComments,
      readLikes,
      // getLikes
      // getComments
    }

    function map (msg, seq) {
      var root

      switch (getType(msg)) {
        case 'blog':
          if (isBlog(msg) && isMyMsg(msg)) return [['B', msg.key, getTimestamp(msg)]]
          else return []

        case 'vote':
          // process.stdout.write('L')
          root = getLikeRoot(msg)
          // TODO figure out how to only store likes I care about
          if (root) return [['L', root, getTimestamp(msg)]]
          else return []

          // Note this catches:
          //   - all likes, on all things D:
          //   - likes AND unlikes

        case 'post':
          // process.stdout.write('POST ')
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

    // a Plog is a Blog shaped Post
    function isPlog (msg) {
      // return false // Disable plogs
      if (get(msg, 'value.content.text', '').length >= 3000) console.log(get(msg, 'value.content.text', '').length)
      return get(msg, 'value.content.text', '').length >= 3000
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

    function getBlogKey (blog) {
      if (isMsgRef(blog)) return blog
      // else if (isMsgRef(blog.key) && isBlog(blog)) return blog.key
      else if (isMsgRef(blog.key) && (isBlog(blog) || isPlog(blog))) return blog.key
    }

    function isMyMsg (msg) {
      return getAuthor(msg) === myKey
    }
  }
}

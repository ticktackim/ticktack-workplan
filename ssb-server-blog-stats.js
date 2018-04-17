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

const FLUME_VIEW_VERSION = 5

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
          if (isBlog(msg) && myBlog(msg)) return [['B', msg.key, getTimestamp(msg)]]
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
          // process.stdout.write('C')
          root = getCommentRoot(msg)
          // TODO figure out how to only store likes I care about
          if (root) return [['C', root, getTimestamp(msg)]]
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
        lte: ['B~', undefined, undefined],
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

    function readComments (options = {}) {
      var key
      if (!options.blog) key = null
      else if (isMsgRef(options.blog)) key = options.blog
      else if (isMsgRef(options.blog.key) && isBlog(options.blog)) key = options.blog.key

      const query = Object.assign({}, {
        gt: ['C', key, null],
        lt: ['C', key, undefined],
        // undefined is the 'maximum' structure in bytewise ordering https://www.npmjs.com/package/bytewise#order-of-supported-structures
        reverse: true,
        values: true,
        keys: false,
        seqs: false
      }, options)

      delete query.blog

      return view.read(query)
    }

    function readLikes (options = {}) {
      var key
      if (!options.blog) key = null
      else if (isMsgRef(options.blog)) key = options.blog
      else if (isMsgRef(options.blog.key) && isBlog(options.blog)) key = options.blog.key

      const query = Object.assign({}, {
        // gt: ['L', key, null],
        // lt: ['L', key, undefined], // why doesn't this work?
        gt: ['L', key, null],            // null is minimum in bytewise ordering
        lt: ['L', key + '~', undefined], // undefinted in maximum in bytewise ordering
        reverse: true,
        values: true,
        keys: false,
        seqs: false
      }, options)

      delete query.blog

      return view.read(query)
    }

    function myBlog (msg) {
      return getAuthor(msg) === myKey
    }
  }
}

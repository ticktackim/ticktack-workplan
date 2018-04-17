const nest = require('depnest')
const { h, Value, Struct, Array: MutantArray, Dict, onceTrue, map, computed, dictToCollection } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.page.statsShow')

exports.needs = nest({
  'sbot.obs.connection': 'first',
  'history.sync.push': 'first'
})

exports.create = (api) => {
  return nest('app.page.statsShow', statsShow)

  function statsShow (location) {
    var store = Struct({
      blogs: MutantArray([]),
      comments: Dict(),
      likes: Dict()
    })

    var howFarBack = Value(0)
    // stats show a moving window of 30 days
    const now = Date.now()
    const thirtyDays = 30 * 24 * 60 * 60 * 1000

    // TODO
    var range = computed([howFarBack], howFarBack => {
      return {
        upper: now - howFarBack * thirtyDays,
        lower: now - (howFarBack + 1) * thirtyDays
      }
    })

    var rangeComments = computed([dictToCollection(store.comments), range], (comments, range) => {
      return comments
        .map(c => c.value)
        .reduce((n, sofar) => [...n, ...sofar], [])
        .filter(msg => {
          const ts = msg.value.timestamp
          return ts >= range.lower && ts <= range.upper
        })
    })

    var rangeLikes = computed([dictToCollection(store.likes), range], (likes, range) => {
      return likes
        .map(c => c.value)
        .reduce((n, sofar) => [...n, ...sofar], [])
        .filter(msg => {
          const ts = msg.value.timestamp
          return ts >= range.lower && ts <= range.upper
        })
    })

    onceTrue(api.sbot.obs.connection, server => {
      fetchBlogs({ server, store })
      // fetches blogs and all associated data

      // ///// test code /////
      // var blogKey = '%3JeEg7voZF4aplk9xCEAfhFOx+zocbKhgstzvfD3G8w=.sha256'
      // console.log('fetching comments', blogKey) // has 2 comments, 1 like

      // pull(
      //   server.blogStats.read({
      //     gt: ['L', blogKey, null],
      //     lt: ['L', blogKey+'~', undefined],
      //     // gt: ['L', blogKey, null],
      //     // lte: ['L', blogKey+'~', undefined],
      //     // limit: 100,
      //     keys: true,
      //     values: true,
      //     seqs: false,
      //     reverse: true
      //   }),
      //   // pull.filter(o => o.key[1] === blogKey),
      //   pull.log(() => console.log('DONE'))
      // )
      /// ///// test code /////
    })

    return h('Page -statsShow', [
      h('div.content', [
        h('h1', 'Stats'),
        h('section.totals', [
          h('div.comments', [
            h('div.count', computed(rangeComments, msgs => msgs.length)),
            h('strong', 'Comments'),
            '(30 days)'
          ]),
          h('div.likes', [
            h('div.count', computed(rangeLikes, msgs => msgs.length)),
            h('strong', 'Likes'),
            '(30 days)'
          ]),
          h('div.shares', [
          ])
        ]),
        h('section.graph', [
          // TODO insert actual graph
          h('div', [
            h('div', [ 'Comments ', map(rangeComments, msg => [new Date(msg.value.timestamp).toDateString(), ' ']) ]),
            h('div', [ 'Likes ', map(rangeLikes, msg => [new Date(msg.value.timestamp).toDateString(), ' ']) ])
          ]),
          h('div', [
            h('a', { href: '#', 'ev-click': () => howFarBack.set(howFarBack() + 1) }, '< Prev 30 days'),
            ' | ',
            h('a', { href: '#', 'ev-click': () => howFarBack.set(howFarBack() - 1) }, 'Next 30 days >'),
            h('div', ['howFarBack:', howFarBack]) // TODO change - this is temporary
          ])
        ]),
        h('table.blogs', [
          h('thead', [
            h('tr', [
              h('th.details'),
              h('th.comment', 'Comments'),
              h('th.likes', 'Likes')
            ])
          ]),
          h('tbody', map(store.blogs, blog => h('tr.blog', [
            h('td.details', [
              h('div.title', {}, blog.value.content.title),
              h('a',
                {
                  href: '#',
                  'ev-click': viewBlog(blog)
                },
                'View blog'
              )
            ]),
            h('td.comments', computed(store.comments.get(blog.key), msgs => msgs ? msgs.length : 0)),
            h('td.likes', computed(store.likes.get(blog.key), msgs => msgs ? msgs.length : 0))
          ])))
        ])
      ])
    ])
  }

  function viewBlog (blog) {
    return () => api.history.sync.push(blog)
  }
}

function fetchBlogs ({ server, store }) {
  pull(
    server.blogStats.readBlogs({ reverse: false }),
    pull.drain(blog => {
      store.blogs.push(blog)

      fetchComments({ server, store, blog })
      fetchLikes({ server, store, blog })
    })
  )
}

function fetchComments ({ server, store, blog }) {
  if (!store.comments.has(blog.key)) store.comments.put(blog.key, MutantArray())

  pull(
    server.blogStats.readComments(blog),
    pull.drain(comment => {
      store.comments.get(blog.key).push(comment)
      // TODO remove my comments from count?
    })
  )
}

function fetchLikes ({ server, store, blog }) {
  if (!store.likes.has(blog.key)) store.likes.put(blog.key, MutantArray())

  pull(
    server.blogStats.readLikes(blog),
    pull.drain(comment => {
      store.likes.get(blog.key).push(comment)
      // TODO this needs reducing... like + unlike are muddled in here
      //   find any thing by same author
      //   if exists - over-write or delete
    })
  )
}

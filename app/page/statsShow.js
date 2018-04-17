const nest = require('depnest')
const { h, Array: MutantArray, Dict, onceTrue, map } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.page.statsShow')

exports.needs = nest({
  'sbot.obs.connection': 'first'
})

exports.create = (api) => {
  return nest('app.page.statsShow', statsShow)

  function statsShow (location) {
    var blogs = MutantArray([])
    var comments = Dict()
    var likes = Dict()
    // comments(console.log)

    onceTrue(api.sbot.obs.connection, server => {
      // console.log(Object.keys(server.blogStats))

      fetchBlogs()

      function fetchBlogs () {
        pull(
          server.blogStats.readBlogs({ reverse: false }),
          pull.drain(blog => {
            blogs.push(blog)
            fetchComments(blog)
            fetchLikes(blog)
          })
        )
      }

      function fetchComments (blog) {
        if (!comments.has(blog.key)) comments.put(blog.key, MutantArray())

        pull(
          server.blogStats.readComments({ blog }),
          pull.drain(comment => {
            comments.get(blog.key).push(comment)
          })
        )
      }

      function fetchLikes (blog) {
        if (!likes.has(blog.key)) likes.put(blog.key, MutantArray())

        pull(
          server.blogStats.readLikes({ blog }),
          pull.drain(comment => {
            likes.get(blog.key).push(comment)
          })
        )
      }

      // ///// test code /////
      var blogKey = '%3JeEg7voZF4aplk9xCEAfhFOx+zocbKhgstzvfD3G8w=.sha256'
      // console.log('fetching comments', blogKey) // has 2 comments, 1 like

      pull(
        server.blogStats.read({
          gt: ['L', blogKey, null],
          lt: ['L', blogKey+'~', undefined],
          // gt: ['L', blogKey, null],
          // lte: ['L', blogKey+'~', undefined],
          // limit: 100,
          keys: true,
          values: true,
          seqs: false,
          reverse: true
        }),
        // pull.filter(o => o.key[1] === blogKey),
        pull.log(() => console.log('DONE'))
      )
      /// ///// test code /////
    })

    return h('Page -statsShow', [
      h('pre', map(blogs, blog => {
        return h('div', [
          h('b', blog.value.content.title),
          h('div', map(comments.get(blog.key), msg => 'C')),
          h('div', map(likes.get(blog.key), msg => 'L'))
        ])
      }))
    ])
  }
}

const nest = require('depnest')
const { h, when, Value, Struct, Array: MutantArray, Dict, onceTrue, map, computed, throttle, watchAll } = require('mutant')
const pull = require('pull-stream')
const marksum = require('markdown-summary')
const Chart = require('chart.js')
const groupBy = require('lodash/groupBy')
const flatMap = require('lodash/flatMap')
const get = require('lodash/get')

const chartConfig = require('../../config/chart')

exports.gives = nest('app.page.statsShow')

exports.needs = nest({
  'app.html.sideNav': 'first',
  'history.sync.push': 'first',
  'message.html.markdown': 'first',
  'sbot.obs.connection': 'first',
  'translations.sync.strings': 'first'
})

const COMMENTS = 'comments'
const LIKES = 'likes'
const SHARES = 'shares'
const DAY = 24 * 60 * 60 * 1000

const getRoot = {
  [COMMENTS]: (msg) => get(msg, 'value.content.root'),
  [LIKES]: (msg) => get(msg, 'value.content.vote.link')
}

exports.create = (api) => {
  return nest('app.page.statsShow', statsShow)

  function statsShow (location) {
    const strings = api.translations.sync.strings()
    const t = strings.statsShow

    var store = Struct({
      blogs: MutantArray([]),
      comments: Dict(),
      likes: Dict(),
      shares: Dict()
    })
    onceTrue(api.sbot.obs.connection, server => fetchBlogData({ server, store }))

    var foci = Struct({
      [COMMENTS]: computed([throttle(store.comments, 1000)], (msgs) => {
        return flatMap(msgs, (val, key) => val)
      }),
      [LIKES]: computed([throttle(store.likes, 1000)], (msgs) => {
        return flatMap(msgs, (val, key) => val)
      }),
      [SHARES]: []
    })

    var howFarBack = Value(0)
    // stats show a moving window of 30 days
    var context = Struct({
      focus: Value(COMMENTS),
      blog: Value(),
      range: computed([howFarBack], howFarBack => {
        const now = Date.now()
        const endOfDay = (Math.floor(now / DAY) + 1) * DAY

        return {
          upper: endOfDay - howFarBack * 30 * DAY,
          lower: endOfDay - (howFarBack + 1) * 30 * DAY
        }
      })
    })

    function totalOnscreenData (focus) {
      return computed([foci[focus], context], (msgs, context) => {
        // NOTE this filter logic is repeated in chartData
        return msgs
          .filter(msg => {
            if (!context.blog) return true
            // if context.blog is set, filter down to only msgs about that blog
            return getRoot[focus](msg) === context.blog
          })
          .filter(msg => {
            // don't count unlikes
            if (focus === LIKES) return get(msg, 'value.content.vote.value') > 0
            else return true
          })
          .filter(msg => {
            const ts = msg.value.timestamp
            return ts > context.range.lower && ts <= context.range.upper
          })
          .length
      })
    }

    const canvas = h('canvas', { height: 200, width: 600, style: { height: '200px', width: '600px' } })

    const page = h('Page -statsShow', [
      api.app.html.sideNav(location),
      h('Scroller.content', [
        h('div.content', [
          h('h1', t.title),
          h('section.totals', [COMMENTS, LIKES, SHARES].map(focus => {
            return h('div',
              {
                classList: computed(context.focus, f => f === focus ? [focus, '-selected'] : [focus]),
                'ev-click': () => context.focus.set(focus)
              }, [
                h('div.count', totalOnscreenData(focus)),
                h('strong', strings[focus]),
                '(',
                t.thirtyDays,
                ')'
              ])
          })),
          h('section.graph', [
            canvas,
            h('div.changeRange', [
              '< ',
              h('a', { 'ev-click': () => howFarBack.set(howFarBack() + 1) }, t.prevMonth),
              ' | ',
              when(howFarBack,
                h('a', { 'ev-click': () => howFarBack.set(howFarBack() - 1) }, t.nextMonth),
                h('span', t.nextMonth)
              ),
              ' >'
            ])
          ]),
          h('table.blogs', [
            h('thead', [
              h('tr', [
                h('th.details'),
                h('th.comments', strings.comments),
                h('th.likes', strings.likes),
                h('th.shares', strings.shares)
              ])
            ]),
            h('tbody', map(store.blogs, BlogRow))
          ])
        ])
      ])
    ])

    function BlogRow (blog) {
      const className = computed(context.blog, b => {
        if (!b) return ''
        if (b !== blog.key) return '-background'
      })

      return h('tr.blog', { id: blog.key, className }, [
        h('td.details', [
          h('div.title', {
            'ev-click': () => {
              if (context.blog() === blog.key) context.blog.set('')
              else context.blog.set(blog.key)
            }
          }, getTitle({ blog, mdRenderer: api.message.html.markdown })),
          h('a', {
            href: '#',
            'ev-click': ev => {
              ev.stopPropagation() // stop the click catcher!
              api.history.sync.push(blog)
            }
          }, 'View blog')
        ]),
        h('td.comments', computed(store.comments.get(blog.key), msgs => msgs ? msgs.length : 0)),
        h('td.likes', computed(store.likes.get(blog.key), msgs => msgs ? msgs.length : 0)),
        h('td.shares', computed(store.shares.get(blog.key), msgs => msgs ? msgs.length : 0))
      ])
    }

    initialiseChart({ canvas, context, foci })

    return page
  }
}

function getTitle ({ blog, mdRenderer }) {
  if (blog.value.content.title) return blog.value.content.title
  else if (blog.value.content.text) {
    var md = mdRenderer(marksum.title(blog.value.content.text))
    if (md && md.innerText) return md.innerText
  }

  return blog.key
}

function fetchBlogData ({ server, store }) {
  const myKey = server.id

  server.ticktack.getBlogs({}, (err, blogs) => {
    if (err) console.error(err)

    // TODO - change this once merge in the new notifications-hanger work
    //   i.e. do one query for ALL comments on my blogs as opposed to N queries
    blogs.forEach(blog => {
      fetchComments({ server, store, blog })
      fetchLikes({ server, store, blog })
    })

    blogs = blogs
      .sort((a, b) => a.value.timestamp > b.value.timestamp ? -1 : +1)
    store.blogs.set(blogs)
  })

  function fetchComments ({ server, store, blog }) {
    if (!store.comments.has(blog.key)) store.comments.put(blog.key, MutantArray())

    pull(
      server.ticktack.readComments(blog),
      pull.drain(msg => {
        if (msg.value.author === myKey) return
        store.comments.get(blog.key).push(msg)
      })
    )
  }

  function fetchLikes ({ server, store, blog }) {
    if (!store.likes.has(blog.key)) store.likes.put(blog.key, MutantArray())

    pull(
      server.ticktack.readLikes(blog),
      pull.drain(msg => {
        if (msg.value.author === myKey) return

        const isUnlike = get(msg, 'value.content.vote.value', 1) < 1

        var likes = store.likes.get(blog.key)
        var extantLike = likes.find(m => m.value.author === msg.value.author)
        // extant means existing

        if (!extantLike) return likes.push(msg)
        else {
          if (msg.value.timestamp < extantLike.value.timestamp) return
          else {
            // case: we have a new like/ unlike value
            if (isUnlike) likes.delete(extantLike)
            else likes.put(likes.indexOf(extantLike), msg)
          }
        }
      })
    )
  }
}

function initialiseChart ({ canvas, context, foci }) {
  var chart = new Chart(canvas.getContext('2d'), chartConfig({ context }))

  const chartData = computed([context, foci], (context, foci) => {
    fixAnimationWhenNeeded(context)

    const { focus } = context
    // NOTE this filter logic is repeated in totalOnscreenData
    const msgs = foci[focus]
      .filter(msg => {
        if (!context.blog) return true
        // if context.blog is set, filter down to only msgs about that blog
        return getRoot[focus](msg) === context.blog
      })
      .filter(msg => {
        // don't count unlikes
        if (focus === LIKES) return get(msg, 'value.content.vote.value') > 0
        else return true
      })

    const grouped = groupBy(msgs, m => toDay(m.value.timestamp))

    return Object.keys(grouped)
      .map(day => {
        return {
          t: day * DAY + DAY / 2,
          y: grouped[day].length
        }
        // NOTE - this collects the data points for a day at t = 10ms into the day
        // this is necessary for getting counts to line up (bars, and daily count)
        // I think because total counts for totalOnscreenData don't collect data in the same way?
        // TODO - refactor this, to be tidier
      })
  })

  chartData(data => {
    chart.data.datasets[0].data = data

    chart.update()
  })

  // Scales the height of the graph (to the visible data)!
  watchAll([chartData, context.range], (data, range) => {
    const { lower, upper } = range
    const slice = data
      .filter(d => d.t > lower && d.t <= upper)
      .map(d => d.y)
      .sort((a, b) => a > b ? -1 : +1)

    var h = slice[0]
    if (!h || h < 10) h = 10
    else h = h + (5 - h % 5)
        // set the height of the graph to a minimum or 10,
        // or some multiple of 5 above the max height

    chart.options.scales.yAxes[0].ticks.max = h

    chart.update()
  })

  // Update the x-axes bounds of the graph!
  context.range(range => {
    const { lower, upper } = range

    chart.options.scales.xAxes[0].time.min = lower
    chart.options.scales.xAxes[0].time.max = upper

    chart.update()
  })

  // ///// HELPERS /////

  // HACK - if the focus has changed, then zero the data
  // this prevents the graph from showing some confusing animations when transforming between foci / selecting blog
  var prevFocus = context.focus()
  var prevBlog = context.blog()
  function fixAnimationWhenNeeded (context) {
    if (context.focus !== prevFocus || context.blog !== prevBlog) {
      chart.data.datasets[0].data = []
      chart.update()
      prevFocus = context.focus
      prevBlog = context.blog
    }
  }
  function toDay (ts) { return Math.floor(ts / DAY) }
}

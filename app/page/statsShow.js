const nest = require('depnest')
const { h, resolve, when, Value, Struct, Array: MutantArray, Dict, onceTrue, map, computed, dictToCollection, throttle, watchAll } = require('mutant')
const pull = require('pull-stream')
const marksum = require('markdown-summary')
const Chart = require('chart.js')
const groupBy = require('lodash/groupBy')
const mergeWith = require('lodash/mergeWith')
const flatMap = require('lodash/flatMap')

exports.gives = nest('app.page.statsShow')

exports.needs = nest({
  'sbot.obs.connection': 'first',
  'history.sync.push': 'first'
})

const COMMENTS = 'comments'
const LIKES = 'likes'
const DAY = 24 * 60 * 60 * 1000

exports.create = (api) => {
  return nest('app.page.statsShow', statsShow)

  function statsShow (location) {
    var store = Struct({
      blogs: MutantArray([]),
      comments: Dict(),
      likes: Dict()
    })
    onceTrue(api.sbot.obs.connection, server => fetchBlogs({ server, store }))

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

    var foci = Struct({
      [COMMENTS]: computed([throttle(store.comments, 1000)], (msgs) => {
        return flatMap(msgs, (val, key) => val)
      }),
      [LIKES]: computed([throttle(store.likes, 1000)], (msgs) => {
        return flatMap(msgs, (val, key) => val)
      })

    })

    var visibleCommentsCount = computed([foci.comments, context.range], (msgs, range) => {
      return msgs
        .filter(msg => {
          const ts = msg.value.timestamp
          return ts > range.lower && ts <= range.upper
        })
        .length
    })

    var visibleLikesCount = computed([foci.likes, context.range], (msgs, range) => {
      return msgs
        .filter(msg => {
          const ts = msg.value.timestamp
          return ts > range.lower && ts <= range.upper
        })
        .length
    })

    const canvas = h('canvas', { height: 200, width: 600, style: { height: '200px', width: '600px' } })

    const displayComments = () => context.focus.set(COMMENTS)
    const displayLikes = () => context.focus.set(LIKES)

    const page = h('Page -statsShow', [
      h('Scroller.content', [
        h('div.content', [
          h('h1', 'Stats'),
          h('section.totals', [
            h('div.comments',
              {
                className: computed(context.focus, focus => focus === COMMENTS ? '-selected' : ''),
                'ev-click': displayComments
              }, [
                h('div.count', visibleCommentsCount),
                h('strong', 'Comments'),
                '(30 days)'
              ]),
            h('div.likes',
              {
                className: computed(context.focus, focus => focus === LIKES ? '-selected' : ''),
                'ev-click': displayLikes
              }, [
                h('div.count', visibleLikesCount),
                h('strong', 'Likes'),
                '(30 days)'
              ]
            ),
            h('div.shares',
              {
                className: when(context.shares, '-selected')
                // 'ev-click': displayShares
              }, [
                // h('div.count', computed(rangeLikes, msgs => msgs.length)),
                h('div.count', '--'),
                h('strong', 'Shares'),
                '(30 days)'
              ]
            )
          ]),
          h('section.graph', [
            canvas,
            h('div.changeRange', [
              '< ',
              h('a', { 'ev-click': () => howFarBack.set(howFarBack() + 1) }, 'Prev 30 days'),
              ' | ',
              when(howFarBack,
                h('a', { 'ev-click': () => howFarBack.set(howFarBack() - 1) }, 'Next 30 days'),
                h('span', 'Next 30 days')
              ),
              ' >'
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
            h('tbody', map(store.blogs, blog => h('tr.blog', { id: blog.key }, [
              h('td.details', [
                h('div.title', {}, getTitle(blog)),
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
            // ]), { comparer: (a, b) => a === b }))
            ])))
          ])
        ])
      ])
    ])

    var chart = new Chart(canvas.getContext('2d'), chartConfig({ context, chartData: [] }))

    // HACK - if the focus has changed, then zero the data
    // this prevents the graph from showing some confusing animations when transforming between foci
    var lastFocus = context.focus()
    const zeroGraphOnFocusChange = (focus) => {
      if (focus !== lastFocus) {
        chart.data.datasets[0].data = []
        chart.update()
        lastFocus = focus
      }
    }
    const toDay = ts => Math.floor(ts / DAY)
    const chartData = computed([context.focus, foci], (focus, foci) => {
      zeroGraphOnFocusChange(focus)
      const msgs = foci[focus]
      const grouped = groupBy(msgs, m => toDay(m.value.timestamp))

      var data = Object.keys(grouped)
        .map(day => {
          return {
            t: day * DAY,
            y: grouped[day].length
          }
        })
      return data
    })

    chartData(data => {
      chart.data.datasets[0].data = data

      chart.update()
    })

    watchAll([chartData, context.range], (data, range) => {
    // const graphHeight = computed([chartData, context.range], (data, range) => {
      const { lower, upper } = range
      const slice = data
        .filter(d => d.t > lower && d.t <= upper)
        .map(d => d.y)
        .sort((a, b) => a < b)

      var h = slice[0]
      if (!h || h < 10) h = 10
      else h = h + (5 - h % 5)

      chart.options.scales.yAxes[0].ticks.max = h

      chart.update()
    })
    // graphHeight(h => {
    //   chart.options.scales.yAxes[0].ticks.max = h
    //   console.log('listen', h)

    //   chart.update()
    // })

    context.range(range => {
      const { lower, upper } = range

      chart.options.scales.xAxes[0].time.min = new Date(lower + DAY / 2)
      chart.options.scales.xAxes[0].time.max = new Date(upper - DAY / 2)
      // the squeezing in by DAY/2 is to stop data outside range from half showing

      chart.update()
    })

    return page
  }

  function viewBlog (blog) {
    return () => api.history.sync.push(blog)
  }
}

function getTitle (blog) {
  if (blog.value.content.title) return blog.value.content.title
  else if (blog.value.content.text) return marksum.title(blog.value.content.text)
  else return blog.key
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
    pull.drain(msg => {
      store.comments.get(blog.key).push(msg)
      // TODO remove my comments from count?
    })
  )
}

function fetchLikes ({ server, store, blog }) {
  if (!store.likes.has(blog.key)) store.likes.put(blog.key, MutantArray())

  pull(
    server.blogStats.readLikes(blog),
    pull.drain(msg => {
      store.likes.get(blog.key).push(msg)
      // TODO this needs reducing... like + unlike are muddled in here
      //   find any thing by same author
      //   if exists - over-write or delete
    })
  )
}

// TODO rm chartData and other overly smart things which didn't work from here
function chartConfig ({ context }) {
  const { lower, upper } = resolve(context.range)

  return {
    type: 'bar',
    data: {
      datasets: [{
        backgroundColor: 'hsla(215, 57%, 60%, 1)',
        // Ticktack Primary color:'hsla(215, 57%, 43%, 1)',
        borderColor: 'hsla(215, 57%, 60%, 1)',
        data: []
      }]
    },
    options: {
      legend: {
        display: false
      },
      scales: {
        xAxes: [{
          type: 'time',
          distribution: 'linear',
          time: {
            unit: 'day',
            min: new Date(lower),
            max: new Date(upper),
            tooltipFormat: 'MMMM D',
            stepSize: 7
          },
          bounds: 'ticks',
          ticks: {
            // maxTicksLimit: 4
          },
          gridLines: {
            display: false
          },
          maxBarThickness: 20
        }],

        yAxes: [{
          ticks: {
            min: 0,
            suggestedMax: 10,
            // max: Math.max(localMax, 10),
            stepSize: 5
          }
        }]
      },
      animation: {
        // duration: 300
      }
    }
  }
}

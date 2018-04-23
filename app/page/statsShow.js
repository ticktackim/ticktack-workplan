const nest = require('depnest')
const { h, resolve, when, Value, Struct, Array: MutantArray, Dict, onceTrue, map, computed, dictToCollection, throttle } = require('mutant')
const pull = require('pull-stream')
const marksum = require('markdown-summary')
const Chart = require('chart.js')
const groupBy = require('lodash/groupBy')
const merge = require('lodash/merge')

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
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

    // TODO
    var range = computed([howFarBack], howFarBack => {
      const now = Date.now()
      return {
        upper: now - howFarBack * THIRTY_DAYS,
        lower: now - (howFarBack + 1) * THIRTY_DAYS
      }
    })

    var commentsAll = computed(throttle(dictToCollection(store.comments), 1000), (comments) => {
      return comments
        .map(c => c.value)
        .reduce((n, sofar) => [...n, ...sofar], [])
    })

    // this should perhaps be reduced to just return commentsContextCount
    var visibleComments = computed([commentsAll, range], (comments, range) => {
      return comments
        .filter(msg => {
          const ts = msg.value.timestamp
          return ts >= range.lower && ts <= range.upper
        })
    })

    var rangeLikes = computed([throttle(dictToCollection(store.likes), 1000), range], (likes, range) => {
      return likes
        .map(c => c.value)
        .reduce((n, sofar) => [...n, ...sofar], [])
        // .filter(msg => {
        //   const ts = msg.value.timestamp
        //   return ts >= range.lower && ts <= range.upper
        // })
    })

    onceTrue(api.sbot.obs.connection, server => {
      fetchBlogs({ server, store })

      // const query = {
      //   gt: ['C', null, range().lower],
      //   lt: ['C', undefined, range().upper],
      //   reverse: true,
      //   values: true,
      //   keys: false,
      //   seqs: false
      // }
      // console.log('test query', query)
      // pull(server.blogStats.read(query), pull.log(() => console.log('DONE')))
    })
    const canvas = h('canvas', { height: 200, width: 600, style: { height: '200px', width: '600px' } })

    const page = h('Page -statsShow', [
      h('Scroller.content', [
        h('div.content', [ 
          h('h1', 'Stats'),
          h('section.totals', [
            h('div.comments', [
              h('div.count', computed(visibleComments, msgs => msgs.length)),
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

    // Chart.scaleService.updateScaleDefaults('linear', {
    //   ticks: { min: 0 }
    // })
    var chart = new Chart(canvas.getContext('2d'), chartConfig({ range, chartData: [] }))

    const toDay = ts => Math.floor(ts / (24 * 60 * 60 * 1000))

    // TODO take in context (comments/ likes / shares)
    const chartData = computed(commentsAll, msgs => {
      const grouped = groupBy(msgs, m => toDay(m.value.timestamp))

      var data = Object.keys(grouped)
        .map(day => {
          return {
            t: day * 24 * 60 * 60 * 1000,
            y: grouped[day].length
          }
        })
      return data
    })

    chartData(() => {
      chart = merge(chart, chartConfig({ range, chartData }))
      chart.update()
    })

    range(() => {
      chart = merge(chart, chartConfig({ range, chartData }))
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

function chartConfig ({ range, chartData }) {
  const { lower, upper } = resolve(range)

  const data = resolve(chartData) || []
  const slice = data
    .filter(d => d.t >= lower && d.t <= upper)
    .map(d => d.y)
    .sort((a, b) => a < b)
  const localMax = slice[0] ? Math.max(slice[0], 10) : 10

  return {
    type: 'bar',
    data: {
      datasets: [{
        // label: 'My First dataset',
        backgroundColor: 'hsla(215, 57%, 60%, 1)', // 'hsla(215, 57%, 43%, 1)',
        borderColor: 'hsla(215, 57%, 60%, 1)',
        // TODO set initial data as empty to make a good range
        data
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
            max: Math.max(localMax, 10),
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

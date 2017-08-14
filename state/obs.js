var PullObv = require('pull-obv')
var threadReduce = require('ssb-reduce-stream')
var pull = require('pull-stream')
var Next = require('pull-next')

var nest = require('depnest')

function isObject (o) {
  return 'object' === typeof o
}

exports.gives = nest('state.obs.threads', true)

exports.needs = nest({
  'message.sync.unbox': 'first',
  'sbot.pull.log': 'first'
})

exports.create = function (api) {
  var threadsObs

  return nest('state.obs.threads',   function buildThreadObs() {
    if(threadsObs) return threadsObs

//    var initial
//    try { initial = JSON.parse(localStorage.threadsState) }
//    catch (_) { }
//

    initial = {}

    function createStateObs (threadReduce, createStream, initial) {
      var lastTimestamp = initial ? initial.last : Date.now()
      var firstTimestamp = initial ? initial.first || Date.now() : Date.now()

      function unbox () {
        return pull(
          pull.map(function (data) {
            lastTimestamp = data.timestamp
            if(isObject(data.value.content)) return data
            return api.message.sync.unbox(data)
          }),
          pull.filter(Boolean)
        )
      }

      var threadsObs = PullObv(
        threadReduce,
        pull(
          Next(function () {
            return api.sbot.pull.log({reverse: true, limit: 500, lt: lastTimestamp})
          }),
          pull.through(function (data) {
            lastTimestamp = data.timestamp
          }),
          unbox()
        ),
        //value recovered from localStorage
        initial
      )

      //stream live messages. this *should* work.
      //there is no back pressure on new events
      //only a show more on the top (currently)
      pull(
        Next(function () {
          return api.sbot.pull.log({limit: 500, gt: firstTimestamp, live: true})
        }),
        pull.drain(function (data) {
          if(data.sync) return
          firstTimestamp = data.timestamp
          threadsObs.set(threadReduce(threadsObs.value, data))
        })
      )

      return threadsObs
    }

    threadsObs = createStateObs(threadReduce, null, initial)

    threadsObs(function (threadsState) {
      if(threadsState.ended && threadsState.ended !== true)
        console.error('threadObs error:', threadsState.ended)
    })

//    var timer
//    //keep localStorage up to date
//    threadsObs(function (threadsState) {
//      if(timer) return
//      timer = setTimeout(function () {
//        timer = null
//        threadsState.last = lastTimestamp
//        console.log('save state')
//        localStorage.threadsState = JSON.stringify(threadsState)
//      }, 1000)
//    })
//

    return threadsObs
  })
}




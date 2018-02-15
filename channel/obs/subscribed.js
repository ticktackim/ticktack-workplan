var pull = require('pull-stream')
var { Dict, Value, computed, resolve } = require('mutant')
var get = require('lodash/get')
var MutantPullReduce = require('mutant-pull-reduce')
var nest = require('depnest')
var ref = require('ssb-ref')

var throttle = require('mutant/throttle')

exports.needs = nest({
  'sbot.pull.stream': 'first'
})

exports.gives = nest({
  'channel.obs.subscribed': true
})

exports.create = function (api) {
  var cache = Dict()
  cache.sync = Value(false)

  var answerCache = {}

  return nest({
    'channel.obs.subscribed': subscribed,
  })

  function subscribed (userId) {
    if (!cache.keys().length) startCache()

    return getAnswer(userId)
  }

  function getAnswer (userId) {
    if (!answerCache[userId]) {
      answerCache[userId] = computed(cache, cache => {
        const answer = Object.keys(cache)
          .filter(channel => { 
            return cache[channel]
              .map(entry => entry[0])
              .includes(userId)  
          })

        return new Set(answer)
        // previous channel.obs.subscribed uses Sets ... 
      })
      answerCache[userId].sync = cache.sync
    }

    return answerCache[userId]
  }

  function startCache () {
    var initialReceived = false

    pull(
      api.sbot.pull.stream(sbot => {
        return sbot.channel.stream({ live: true })
      }),
      pull.drain(val => {
        if (val === null) {
          return 
        }

        if (!initialReceived) {
          initialReceived = true
          cache.set(val)
          cache.sync.set(true)
          return
        }

        if (val.sync === true) {
          cache.sync.set(true)
          return
        }
         
        // Object.assign seems to bee needed otherwise the cache.set hits some codition where the resolved value gets over-ridden
        // before and set to {} right before the actual set happens!
        var newCache = reduce(Object.assign({}, resolve(cache)), val)
        cache.set(newCache)
      })
    )
  }
}


// TODO - add feature to flumeview-reduce which gives you a copy of the friggen reducer
function reduce (soFar, newSub) {
  // process.stdout.write('c')
  const { author, timestamp, channel, subscribed } = newSub

  var channelSubs = get(soFar, [channel], [])
  var current = channelSubs.find(entry => entry[0] === author)

  // if current recorded statement was more recent than this 'newSub', ignore newSub
  if (current && current[1] > timestamp) return soFar

  // remove all subs entries for this author
  channelSubs = channelSubs.filter(entry => entry[0] !== author)

  if (subscribed) channelSubs.push([author, Number(new Date())])

  soFar[channel] = channelSubs

  return soFar
}



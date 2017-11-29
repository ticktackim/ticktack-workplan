const nest = require('depnest')
const { h } = require('mutant')
const humanTime = require('human-time')

exports.gives = nest('message.html.timeago')

exports.create = function (api) {
  return nest('message.html.timeago', timeago)

  function timeago (msg) {
    const { timestamp } = msg.value

    // TODO implement the light auto-updating of this app-wide
    // perhaps by adding an initializer which sweeps for data-timestamp elements and updates them
    return h('Timeago', humanTime(new Date(timestamp)))
  }
}


module.exports = { 
  async: {
    publish: require('./async/publish'),
  },
  html: {
    channel: require('./html/channel'),
    compose: require('./html/compose'),
    subject: require('./html/subject'),
    timeago: require('./html/timeago')
  }
}


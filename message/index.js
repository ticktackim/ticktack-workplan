module.exports = {
  async: {
    publish: require('./async/publish')
  },
  html: {
    channel: require('./html/channel'),
    comment: require('./html/comment'),
    compose: require('./html/compose'),
    likes: require('./html/likes'),
    notification: require('./html/notification'),
    shares: require('./html/shares'),
    webshares: require('./html/webshares'),
    subject: require('./html/subject'),
    timeago: require('./html/timeago')
  },
  sync: {
    getParticipants: require('./sync/getParticipants')
  },
  obs: {
    shares: require('./obs/shares'),
    webshares: require('./obs/webshares')
  }
}

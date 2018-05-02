module.exports = {
  async: {
    publish: require('./async/publish')
  },
  html: {
    channel: require('./html/channel'),
    comment: require('./html/comment'),
    compose: require('./html/compose'),
    likes: require('./html/likes'),
    subject: require('./html/subject'),
    timeago: require('./html/timeago')
  },
  sync: {
    getParticipants: require('./sync/getParticipants')
  }
}

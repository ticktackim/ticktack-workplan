module.exports = {
  async: require('./async'),
  obs: {
    subscribed: require('./obs/subscribed'),
    subscribedTo: require('./obs/subscribedTo'),
  },
  html: {
    subscribe: require('./html/subscribe')
  }
}

module.exports = {
  obs: {
    getUnreadMsgsCache: require('./obs/getUnreadMsgsCache')
  },
  sync: {
    getStore: require('./sync/getStore'),
    isUnread: require('./sync/isUnread'),
    markRead: require('./sync/markRead'),
    saveStore: require('./sync/saveStore')
  }
}

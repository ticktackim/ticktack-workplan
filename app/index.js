module.exports = {
  html: {
    app: require('./html/app'),
    thread: require('./html/thread')
  },
  page: {
    group: require('./page/group'),
    home: require('./page/home'),
    private: require('./page/private')
  },
  sync: {
    goTo: require('./sync/goTo')
  }
}

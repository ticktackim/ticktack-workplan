module.exports = {
  async: {
    catchLinkClick: require('./async/catch-link-click'),
  },
  html: {
    app: require('./html/app'),
    thread: require('./html/thread'),
    nav: require('./html/nav'),
    threadCard: require('./html/thread-card')
  },
  page: {
    group: require('./page/group'),
    home: require('./page/home'),
    private: require('./page/private')
  }
}

module.exports = {
  async: {
    catchLinkClick: require('./async/catch-link-click'),
  },
  html: {
    app: require('./html/app'),
    thread: require('./html/thread'),
    link: require('./html/link'),
    nav: require('./html/nav'),
    threadCard: require('./html/thread-card'),
    nav: require('./html/nav'),
  },
  page: {
    channel: require('./page/channel'),
    error: require('./page/error'),
    groupFind: require('./page/groupFind'),
    groupIndex: require('./page/groupIndex'),
    groupNew: require('./page/groupNew'),
    groupShow: require('./page/groupShow'),
    home: require('./page/home'),
    settings: require('./page/settings'),
    threadShow: require('./page/threadShow'),
    userFind: require('./page/userFind'),
    userShow: require('./page/userShow'),
  }
}


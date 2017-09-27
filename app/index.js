module.exports = {
  async: {
    catchLinkClick: require('./async/catch-link-click'),
  },
  html: {
    app: require('./html/app'),
    context: require('./html/context'),
    header: require('./html/header'),
    thread: require('./html/thread'),
    link: require('./html/link'),
    threadCard: require('./html/thread-card'),
  },
  page: {
    blogIndex: require('./page/blogIndex'),
    error: require('./page/error'),
    settings: require('./page/settings'),
    // channel: require('./page/channel'),
    // image: require('./page/image'),
    // groupFind: require('./page/groupFind'),
    // groupIndex: require('./page/groupIndex'),
    // groupNew: require('./page/groupNew'),
    // groupShow: require('./page/groupShow'),
    // home: require('./page/home'),
    // threadShow: require('./page/threadShow'),
    userEdit: require('./page/userEdit'),
    // userFind: require('./page/userFind'),
    // userShow: require('./page/userShow'),
    // threadNew: require('./page/threadNew'),
    threadShow: require('./page/threadShow'),
  }
}


module.exports = {
  async: {
    catchLinkClick: require('./async/catch-link-click'),
  },
  html: {
    app: require('./html/app'),
    header: require('./html/header'),
    thread: require('./html/thread'),
    link: require('./html/link'),
    threadCard: require('./html/thread-card'),
  },
  page: {
    channel: require('./page/channel'),
    error: require('./page/error'),
    image: require('./page/image'),
    groupFind: require('./page/groupFind'),
    groupIndex: require('./page/groupIndex'),
    groupNew: require('./page/groupNew'),
    groupShow: require('./page/groupShow'),
    home: require('./page/home'),
    settings: require('./page/settings'),
    threadShow: require('./page/threadShow'),
    userEdit: require('./page/userEdit'),
    userFind: require('./page/userFind'),
    userShow: require('./page/userShow'),
    threadNew: require('./page/threadNew'),
    threadShow: require('./page/threadShow'),
  }
}


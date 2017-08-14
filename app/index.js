module.exports = {
  async: {
    catchLinkClick: require('./async/catch-link-click'),
  },
  html: {
    app: require('./html/app'),
    thread: require('./html/thread'),
    link: require('./html/link'),
    nav: require('./html/nav'),
  },
  page: {
    error: require('./page/error'),
    groupFind: require('./page/groupFind'),
    groupIndex: require('./page/groupIndex'),
    groupNew: require('./page/groupNew'),
    groupShow: require('./page/groupShow'),
    home: require('./page/home'),
    settings: require('./page/settings'),
    userFind: require('./page/userFind'),
    userShow: require('./page/userShow'),
    threadNew: require('./page/threadNew'),
    threadShow: require('./page/threadShow'),
  }
}

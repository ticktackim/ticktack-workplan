module.exports = {
  async: {
    catchLinkClick: require('./async/catch-link-click'),
  },
  html: {
    app: require('./html/app'),
    comments: require('./html/comments'),
    context: require('./html/context'),
    header: require('./html/header'),
    thread: require('./html/thread'),
    link: require('./html/link'),
    blogCard: require('./html/blogCard'),
  },
  page: {
    blogIndex: require('./page/blogIndex'),
    blogNew: require('./page/blogNew'),
    blogShow: require('./page/blogShow'),
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
    userShow: require('./page/userShow'),
    threadNew: require('./page/threadNew'),
    threadShow: require('./page/threadShow'),
  },
  sync: {
    initialize: {
      clickHandler: require('./sync/initialize/clickHandler'),
      styles: require('./sync/initialize/styles'),
      suggests: require('./sync/initialize/suggests'),
    },
    navHistory: require('./sync/nav-history'),
  }
}


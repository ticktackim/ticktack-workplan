module.exports = {
  async: {
    catchLinkClick: require('./async/catch-link-click'),
  },
  html: {
    app: require('./html/app'),
    comments: require('./html/comments'),
    header: require('./html/header'),
    thread: require('./html/thread'),
    link: require('./html/link'),
    lightbox: require('./html/lightbox'),
    blogCard: require('./html/blogCard'),
    channelCard: require('./html/channelCard'),
    topNav: {
      topNavBlog: require('./html/topNav/topNavBlog'),
      topNavBack: require('./html/topNav/zz_topNavBack'),
    },
    scroller: require('./html/scroller'),
    sideNav: {
      discovery: require('./html/sideNav/sideNavDiscovery'),
    }
  },
  page: {
    blogIndex: require('./page/blogIndex'),
    blogNew: require('./page/blogNew'),
    blogSearch: require('./page/blogSearch'),
    blogShow: require('./page/blogShow'),
    error: require('./page/error'),
    settings: require('./page/settings'),
    channelSubscriptions: require('./page/channelSubscriptions'),
    // channel: require('./page/channel'),
    // image: require('./page/image'),
    // groupFind: require('./page/groupFind'),
    // groupIndex: require('./page/groupIndex'),
    // groupNew: require('./page/groupNew'),
    // groupShow: require('./page/groupShow'),
    // threadShow: require('./page/threadShow'),
    userEdit: require('./page/userEdit'),
    // userFind: require('./page/userFind'),
    userShow: require('./page/userShow'),
    splash: require('./page/splash'),
    threadNew: require('./page/threadNew'),
    threadShow: require('./page/threadShow'),
  },
  sync: {
    initialize: {
      clickHandler: require('./sync/initialize/clickHandler'),
      styles: require('./sync/initialize/styles'),
      suggests: require('./sync/initialize/suggests'),
      zoomMemory: require('./sync/initialize/zoomMemory'),
    },
  }
}


module.exports = {
  html: {
    app: require('./html/app')
  },
  page: {
    group: require('./page/group'),
    home: require('./page/home')
  },
  sync: {
    goTo: require('./sync/goTo')
  }
}

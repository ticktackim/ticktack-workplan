module.exports = {
  html: {
    post: require('./html/post'),
    blog: require('./html/blog')
  },
  sync: {
    isBlog: require('./sync/isBlog')
  }
}

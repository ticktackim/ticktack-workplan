module.exports = { 
  async: {
    publish: require('./async/publish'),
  },
  html: {
    compose: require('./html/compose'),
    subject: require('./html/subject')
  }
}


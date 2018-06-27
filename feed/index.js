module.exports = {
  pull: {
    channel: require('./pull/channel'),
    private: require('./pull/private'),
    public: require('./pull/public'),
    user: require('./pull/user')
  }
}

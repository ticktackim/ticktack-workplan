const Config = require('ssb-config/inject')
const nest = require('depnest')
const ssbKeys = require('ssb-keys')
const Path = require('path')

const appName = 'ticktack'
const opts = process.env.ssb_appname== 'ssb' ? {} : require('./default-config.json')

exports.gives = nest('config.sync.load')
exports.create = (api) => {
  var config
  return nest('config.sync.load', () => {
    if (!config) {
      config = Config(process.env.ssb_appname || appName, opts)
      config.keys = ssbKeys.loadOrCreateSync(Path.join(config.path, 'secret'))

      // HACK: fix offline on windows by specifying 127.0.0.1 instead of localhost (default)
      config.remote = `net:127.0.0.1:${config.port}~shs:${config.keys.id.slice(1).replace('.ed25519', '')}`
    }
    return config
  })
}


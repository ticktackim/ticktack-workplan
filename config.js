const Config = require('ssb-config/inject')
const nest = require('depnest')
const ssbKeys = require('ssb-keys')
const Path = require('path')

const appName = process.env.ssb_appname || 'ssb' //'ticktack' TEMP: this is for the windowsSSB installer only
const opts = appName == 'ssb'
  ? null //{ "port": 43750, "blobsPort": 43751, "ws": { "port": 43751 } }
  : require('./default-config.json')

exports.gives = nest('config.sync.load')
exports.create = (api) => {
  var config
  return nest('config.sync.load', () => {
    if (!config) {
      config = Config(appName, opts)
      config.keys = ssbKeys.loadOrCreateSync(Path.join(config.path, 'secret'))

      // HACK: fix offline on windows by specifying 127.0.0.1 instead of localhost (default)
      config.remote = `net:127.0.0.1:${config.port}~shs:${config.keys.id.slice(1).replace('.ed25519', '')}`
    }
    return config
  })
}

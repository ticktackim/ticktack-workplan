const fs = require('fs')
const Path = require('path')
const electron = require('electron')
const Client = require('ssb-client')

// pull config options out of depject
const config = require('./config').create().config.sync.load()

var createSbot = require('scuttlebot')
  .use(require('scuttlebot/plugins/master'))
  .use(require('scuttlebot/plugins/gossip'))
  .use(require('scuttlebot/plugins/replicate'))
  .use(require('ssb-friends'))
  .use(require('ssb-blobs'))
  .use(require('ssb-backlinks'))
  .use(require('ssb-private'))
  .use(require('scuttlebot/plugins/invite'))
  .use(require('scuttlebot/plugins/local'))
  .use(require('scuttlebot/plugins/logging'))
  .use(require('ssb-query'))
  .use(require('ssb-about'))
  // .use(require('ssb-ebt'))
  .use(require('ssb-ws'))
  .use(require('ssb-server-channel'))
  .use(require('./ssb-server-ticktack'))

const manifestPath = Path.join(Path.join(config.path), 'manifest.json')
const isNewInstall = !fs.existsSync(manifestPath)

if (isNewInstall) startSbot()
else {
  // see if we can connect to an existing sbot on this config
  Client(config.keys, config, (err, server) => {
    // err implies no, we should start an sbot
    if (err) startSbot()
    else {
      // there's already and sbot running and we've connected to it
      console.log('> sbot running elsewhere')
      server.close() // close this client connection (app starts one of its own)
      electron.ipcRenderer.send('server-started')
    }
  })
}

function startSbot () {
  console.log('> starting sbot')
  var sbot = createSbot(config)

  console.log('  > updating updating manifest.json')
  var manifest = sbot.getManifest()
  fs.writeFileSync(manifestPath, JSON.stringify(manifest))
  electron.ipcRenderer.send('server-started')
}

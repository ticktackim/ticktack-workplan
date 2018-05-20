const nest = require('depnest')
const { onceTrue } = require('mutant')
const path = require('path')
const fs = require('fs')
const os = require('os')
const config = require('../../config').create().config.sync.load()
const peersFile = path.join(config.path, "gossip.json")
const secretFile = path.join(config.path, "secret")

// TODO: files should take into account env vars

exports.gives = nest('backup.async.importIdentity')

exports.create = function (api) {
  return nest('backup.async.importIdentity', (importData, cb) => {

    fs.writeFileSync(peersFile, JSON.stringify(importData.peers), "utf8")
    fs.writeFileSync(secretFile, importData.secret, "utf8")

    cb()

  })
}

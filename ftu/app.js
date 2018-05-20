const { h, Value, when, resolve, computed, Struct, watch, throttle } = require('mutant')
const nest = require('depnest')
const path = require('path')
const fs = require('fs')
const { remote } = require('electron')
const insertCss = require('insert-css')
const values = require('lodash/values')
const electron = require('electron')
const { dialog } = require('electron').remote
const os = require('os')
const appName = process.env.SSB_APPNAME || 'ssb'
const configFolder = path.join(os.homedir(), `.${appName}`)

var isBusy = Value(false)
var isPresentingOptions = Value(true)

// these initial values are overwritten by the identity file.
var state = Struct({
  latestSequence: 0,
  currentSequence: -1
})

exports.gives = nest('ftu.app')

exports.needs = nest({
  'styles.css': 'reduce',
  'translations.sync.strings': 'first',
})

exports.create = (api) => {
  return nest({
    'ftu.app': function app() {

      const strings = api.translations.sync.strings()

      const css = values(api.styles.css()).join('\n')
      insertCss(css)

      var actionButtons = h('section', [
        h('div.left', h('Button', { 'ev-click': () => actionImportIdentity(strings) }, strings.backup.ftu.importAction)),
        h('div.right', h('Button', { 'ev-click': () => actionCreateNewOne() }, strings.backup.ftu.createAction))
      ])

      var busyMessage = h('p', strings.backup.ftu.busyMessage)

      var initialOptions = h('Page -ftu', [
        h('div.content', [
          h('h1', strings.backup.ftu.welcomeHeader),
          h('p', strings.backup.ftu.welcomeMessage),
          when(isBusy, busyMessage, actionButtons)
        ])
      ])

      var importProcess = h('Page -ftu', [
        h('div.content', [
          h('h1', strings.backup.import.header),
          h('p', [strings.backup.import.synchronizeMessage, state.currentSequence, '/', state.latestSequence]),
        ])
      ])

      // This watcher is responsible for switching from FTU to Ticktack main app
      watch(throttle(state, 500), s => {
        if (s.currentSequence >= s.latestSequence) {
          console.log('all imported')
          electron.ipcRenderer.send('import-completed')
        }
      })

      if (fs.existsSync(path.join(configFolder, "secret"))) {
        // somehow the FTU started but the identity is already in place.
        // treat it as a failed import and start importing...
        console.log('resuming import')
        let previousData = getImportData()
        if (previousData === false) {
          // there is a secret but there is no previous import data.
          // so, we proceed as normal because we can't do anything else,
          // it looks like a normal standard installation...
          setImportData({ importing: false })
          electron.ipcRenderer.send('import-completed')
        } else {
          state.latestSequence.set(previousData.latestSequence)
          state.currentSequence.set(previousData.currentSequence)
          isPresentingOptions.set(false)
          observeSequence()
        }
      }

      var app = h('App', [
        h('Header', [
          windowControls()
        ]),
        when(isPresentingOptions, initialOptions, importProcess)
      ])

      return app
    }
  })
}

electron.ipcRenderer.on('import-started', function (ev, c) {
  console.log('background process is running, begin observing')

  observeSequence()
})



function actionCreateNewOne() {
  isBusy.set(true)
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "../manifest.json")))
  const manifestFile = path.join(configFolder, 'manifest.json')
  if (!fs.existsSync(configFolder)) {
    fs.mkdirSync(configFolder)
  }
  fs.writeFileSync(manifestFile, JSON.stringify(manifest))


  electron.ipcRenderer.send('create-new-identity')
}

function actionImportIdentity(strings) {
  const peersFile = path.join(configFolder, "gossip.json")
  const secretFile = path.join(configFolder, "secret")
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "../manifest.json")))
  const manifestFile = path.join(configFolder, 'manifest.json')

  // place the other files first
  dialog.showOpenDialog(
    {
      title: strings.backup.import.dialog.title,
      butttonLabel: strings.backup.import.dialog.label,
      defaultPath: 'ticktack-identity.backup',
      properties: ['openFile']
    },
    (filenames) => {
      if (typeof filenames !== "undefined") {
        let filename = filenames[0]
        let data = JSON.parse(fs.readFileSync(filename))
        if (data.hasOwnProperty("secret") && data.hasOwnProperty("peers") && data.hasOwnProperty("latestSequence")) {
          if (!fs.existsSync(configFolder)) {
            fs.mkdirSync(configFolder)
          }

          fs.writeFileSync(manifestFile, JSON.stringify(manifest))
          fs.writeFileSync(peersFile, JSON.stringify(data.peers), "utf8")
          fs.writeFileSync(secretFile, data.secret, "utf8")
          state.latestSequence.set(data.latestSequence)
          state.currentSequence.set(0)
          isPresentingOptions.set(false)

          data.importing = true
          data.currentSequence = 0

          setImportData(data)

          electron.ipcRenderer.send('import-identity')
        } else {
          console.log("> bad export file")
          console.log(data)
          alert("Bad Export File")
        }
      }
    }
  )
}

function windowControls() {
  if (process.platform === 'darwin') return

  const window = remote.getCurrentWindow()
  const minimize = () => window.minimize()
  const maximize = () => {
    if (!window.isMaximized()) window.maximize()
    else window.unmaximize()
  }
  const close = () => window.close()

  return h('div.window-controls', [
    h('img.min', {
      src: assetPath('minimize.png'),
      'ev-click': minimize
    }),
    h('img.max', {
      src: assetPath('maximize.png'),
      'ev-click': maximize
    }),
    h('img.close', {
      src: assetPath('close.png'),
      'ev-click': close
    })
  ])
}


function assetPath(name) {
  return path.join(__dirname, '../assets', name)
}


function getImportData() {
  var importFile = path.join(configFolder, 'importing.json')
  if (fs.existsSync(importFile)) {
    let data = JSON.parse(fs.readFileSync(importFile))
    return data || false
  } else {
    return false
  }
}

function setImportData(data) {
  var importFile = path.join(configFolder, 'importing.json')
  fs.writeFileSync(importFile, JSON.stringify(data))
}

function observeSequence() {
  const pull = require('pull-stream')
  const Client = require('ssb-client')
  const config = require('../config').create().config.sync.load()
  const _ = require('lodash')

  Client(config.keys, config, (err, ssbServer) => {
    if (err) {
      console.error('problem starting client', err)
    } else {
      console.log('> sbot running!!!!')

      var feedSource = ssbServer.createUserStream({
        live: true,
        id: ssbServer.id
      })

      var valueLogger = pull.drain((msg) => {
        let seq = _.get(msg, "value.sequence", false)
        if (seq) {
          state.currentSequence.set(seq)
        }
      })

      pull(
        feedSource,
        valueLogger,
      )

    }
  })
}
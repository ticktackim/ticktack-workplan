const { h, Value, when, resolve, computed, Struct, watch, throttle } = require('mutant')
const nest = require('depnest')
const path = require('path')
const fs = require('fs')
const { remote } = require('electron')
const insertCss = require('insert-css')
const values = require('lodash/values')
const get = require('lodash/get')
const electron = require('electron')
const { dialog } = require('electron').remote
const os = require('os')
const progress = require('progress-string')

const appName = process.env.SSB_APPNAME || 'ssb'
const configFolder = path.join(os.homedir(), `.${appName}`)

var isBusy = Value(false)
var isPresentingOptions = Value(true)
var checkerTimeout

// these initial values are overwritten by the identity file.
var state = Struct({
  latestSequence: 0,
  confirmedRemotely: false,
  currentSequence: -1
})

exports.gives = nest('ftu.app')

exports.needs = nest({
  'styles.css': 'reduce',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest({
    'ftu.app': function app () {
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

      var importProgress = h('Page -ftu', [
        h('div.content', [
          h('h1', strings.backup.import.header),
          h('p', [strings.backup.import.synchronizeMessage]),
          h('pre', computed(state, s => {
            return progress({
              width: 42,
              total: s.latestSequence,
              style: function (complete, incomplete) {
                // add an arrow at the head of the completed part
                return `${complete}>${incomplete} (${s.currentSequence}/ ${s.latestSequence})`
              }
            })(s.currentSequence)
          }))
        ])
      ])

      // This watcher is responsible for switching from FTU to Ticktack main app
      watch(throttle(state, 500), s => {
        if (s.currentSequence >= s.latestSequence && s.confirmedRemotely) {
          console.log('all imported')
          clearTimeout(checkerTimeout)
          electron.ipcRenderer.send('import-completed')
        }
      })

      if (fs.existsSync(path.join(configFolder, 'secret'))) {
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
        when(isPresentingOptions, initialOptions, importProgress)
      ])

      return app
    }
  })
}

electron.ipcRenderer.on('import-started', function (ev, c) {
  console.log('background process is running, begin observing')

  observeSequence()
})

function actionCreateNewOne () {
  isBusy.set(true)
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json')))
  const manifestFile = path.join(configFolder, 'manifest.json')
  if (!fs.existsSync(configFolder)) {
    fs.mkdirSync(configFolder)
  }
  fs.writeFileSync(manifestFile, JSON.stringify(manifest))

  electron.ipcRenderer.send('create-new-identity')
}

function actionImportIdentity (strings) {
  const peersFile = path.join(configFolder, 'gossip.json')
  const secretFile = path.join(configFolder, 'secret')
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json')))
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
      if (typeof filenames !== 'undefined') {
        let filename = filenames[0]
        let data = JSON.parse(fs.readFileSync(filename))
        if (data.hasOwnProperty('secret') && data.hasOwnProperty('peers') && data.hasOwnProperty('latestSequence')) {
          if (!fs.existsSync(configFolder)) {
            fs.mkdirSync(configFolder)
          }

          fs.writeFileSync(manifestFile, JSON.stringify(manifest))
          fs.writeFileSync(peersFile, JSON.stringify(data.peers), 'utf8')
          fs.writeFileSync(secretFile, data.secret, 'utf8')
          state.latestSequence.set(data.latestSequence)
          state.currentSequence.set(0)
          isPresentingOptions.set(false)

          data.importing = true
          data.currentSequence = 0

          setImportData(data)

          electron.ipcRenderer.send('import-identity')
        } else {
          console.log('> bad export file')
          console.log(data)
          alert('Bad Export File')
        }
      }
    }
  )
}

function windowControls () {
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

function assetPath (name) {
  return path.join(__dirname, '../assets', name)
}

function getImportData () {
  var importFile = path.join(configFolder, 'importing.json')
  if (fs.existsSync(importFile)) {
    let data = JSON.parse(fs.readFileSync(importFile))
    return data || false
  } else {
    return false
  }
}

function setImportData (data) {
  var importFile = path.join(configFolder, 'importing.json')
  fs.writeFileSync(importFile, JSON.stringify(data))
}

function observeSequence () {
  const pull = require('pull-stream')
  const Client = require('ssb-client')
  const config = require('../config').create().config.sync.load()

  Client(config.keys, config, (err, ssbServer) => {
    if (err) return console.error('problem starting client', err)

    console.log('> sbot running!!!!')

    ssbServer.gossip.peers((err, peers) => {
      if (err) return console.error(err)

      connectToPeers(peers)
      checkPeers()
    })

    // start listening to the my seq, and update the state
    pull(
      ssbServer.createUserStream({ live: true, id: ssbServer.id }),
      pull.drain((msg) => {
        let seq = get(msg, 'value.sequence', false)
        if (seq) {
          state.currentSequence.set(seq)
        }
      })
    )

    function connectToPeers (peers) {
      if (peers.length > 10) {
        const lessPeers = peers.filter(p => !p.error)
        if (lessPeers.length > 10) peers = lessPeers
      }

      peers.forEach(({ host, port, key }) => {
        if (host && port && key) {
          ssbServer.gossip.connect({ host, port, key }, (err, v) => {
            if (err) console.log('error connecting to ', host, err)
            else console.log('connected to ', host)
          })
        }
      })
    }
    function checkPeers () {
      ssbServer.ebt.peerStatus(ssbServer.id, (err, data) => {
        if (err) {
          checkerTimeout = setTimeout(checkPeers, 5000)
          return
        }

        const latest = resolve(state.latestSequence)

        const remoteSeqs = Object.keys(data.peers)
          .map(p => data.peers[p].seq)    // get my seq reported by each peer
          .filter(s => s >= latest)       // only keep remote seq that confirm or update backup seq
          .sort((a, b) => a > b ? -1 : 1) // order them

        console.log(remoteSeqs)

        const newLatest = remoteSeqs[0]
        if (newLatest) {
          state.latestSequence.set(newLatest)

          // if this value is confirmed remotely twice, assume safe
          if (remoteSeqs.filter(s => s === newLatest).length >= 2) {
            state.confirmedRemotely.set(true)
          }
        }

        checkerTimeout = setTimeout(checkPeers, 5000)
      })
    }
  })
}

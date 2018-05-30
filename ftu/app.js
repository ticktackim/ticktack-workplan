const { h, Value, when, computed, Struct, watch, throttle } = require('mutant')
const nest = require('depnest')
const path = require('path')
const fs = require('fs')
const electron = require('electron')
const os = require('os')
const progress = require('progress-string')
const values = require('lodash/values')

const observeSequence = require('./observeSequence')
const windowControls = require('../windowControls')
const ftuCss = require('./styles')

const appName = process.env.SSB_APPNAME || 'ssb'
const CONFIG_FOLDER = path.join(os.homedir(), `.${appName}`)
const IMPORT_FILE = path.join(CONFIG_FOLDER, 'importing.json')

var isBusy = Value(false)
var isPresentingOptions = Value(true)

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

      const css = [...values(api.styles.css()), ftuCss].join('\n')
      document.head.appendChild(h('style', { innerHTML: css }))

      // This watcher is responsible for switching from FTU to Ticktack main app
      watch(throttle(state, 500), s => {
        if (s.currentSequence >= s.latestSequence && s.confirmedRemotely) {
          console.log('all imported')
          electron.ipcRenderer.send('import-completed')
        }
      })

      if (fs.existsSync(path.join(CONFIG_FOLDER, 'secret'))) {
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
          observeSequence({ state })
        }
      }

      var app = h('App', [
        h('Header', [
          h('img.logoName', { src: assetPath('logo_and_name.png') }),
          windowControls()
        ]),
        when(isPresentingOptions, InitialOptions(), ImportProgress())
      ])

      return app

      function InitialOptions () {
        const { welcomeHeader, welcomeMessage, busyMessage, importAction, createAction } = strings.backup.ftu

        return h('Page', [
          h('div.content', [
            h('section.welcome', [
              h('h1', welcomeHeader),
              h('div', welcomeMessage)
            ]),
            when(isBusy,
              h('p', busyMessage),
              h('section.actionButtons', [
                h('div.left', h('Button', { 'ev-click': () => actionImportIdentity(strings) }, importAction)),
                h('div.right', h('Button -strong', { 'ev-click': () => actionCreateNewOne() }, createAction))
              ])
            )
          ])
        ])
      }

      function ImportProgress () {
        const { header, synchronizeMessage, details } = strings.backup.import

        return h('Page', [
          h('div.content', [
            h('h1', header),
            h('p', synchronizeMessage),
            h('pre', computed(state, s => {
              return progress({
                width: 42,
                total: s.latestSequence,
                style: function (complete, incomplete) {
                  // add an arrow at the head of the completed part
                  return `${complete}>${incomplete} (${s.currentSequence}/ ${s.latestSequence})`
                }
              })(s.currentSequence)
            })),
            h('p', details)
          ])
        ])
      }
    }
  })
}

electron.ipcRenderer.on('import-resumed', function (ev, c) {
  console.log('background process is running, begin observing')

  observeSequence({ state })
})

function actionCreateNewOne () {
  isBusy.set(true)
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json')))
  const manifestFile = path.join(CONFIG_FOLDER, 'manifest.json')
  if (!fs.existsSync(CONFIG_FOLDER)) {
    fs.mkdirSync(CONFIG_FOLDER)
  }
  fs.writeFileSync(manifestFile, JSON.stringify(manifest))

  electron.ipcRenderer.send('create-new-identity')
}

function actionImportIdentity (strings) {
  const gossipFile = path.join(CONFIG_FOLDER, 'gossip.json')
  const secretFile = path.join(CONFIG_FOLDER, 'secret')
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json')))
  const manifestFile = path.join(CONFIG_FOLDER, 'manifest.json')

  // place the other files first
  electron.remote.dialog.showOpenDialog(
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
        if (data.hasOwnProperty('secret') && data.hasOwnProperty('gossip') && data.hasOwnProperty('latestSequence')) {
          if (!fs.existsSync(CONFIG_FOLDER)) {
            fs.mkdirSync(CONFIG_FOLDER)
          }

          fs.writeFileSync(manifestFile, JSON.stringify(manifest))
          fs.writeFileSync(gossipFile, JSON.stringify(data.gossip), 'utf8')
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

function assetPath (name) {
  return path.join(__dirname, '../assets', name)
}

function getImportData () {
  if (fs.existsSync(IMPORT_FILE)) {
    let data = JSON.parse(fs.readFileSync(IMPORT_FILE))
    return data || false
  } else {
    return false
  }
}

function setImportData (data) {
  fs.writeFileSync(IMPORT_FILE, JSON.stringify(data))
}

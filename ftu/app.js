const { h, Value, when, computed, Struct, watch, throttle } = require('mutant')
const nest = require('depnest')
const path = require('path')
const fs = require('fs')
const electron = require('electron')
const os = require('os')
const progress = require('progress-string')
const values = require('lodash/values')

const manageProgress = require('./manageProgress')
const windowControls = require('../windowControls')
const ftuCss = require('./styles')

// const config = require('../config').create().config.sync.load()
const config = {
  path: path.join(os.homedir(), `.${process.env.SSB_APPNAME || process.env.ssb_appname || 'ssb'}`)
}
const SECRET_PATH = path.join(config.path, 'secret')
const MANIFEST_PATH = path.join(config.path, 'manifest.json')
const GOSSIP_PATH = path.join(config.path, 'gossip.json')
const IMPORT_PATH = path.join(config.path, 'importing.json')

// these initial values are overwritten by the identity file.
var state = Struct({
  isPresentingOptions: true,
  creatingNewIdentity: false,
  mySequence: Struct({
    current: 0,
    latest: 0,
    latestConfirmed: false
  }),
  peerSequences: Struct({
    current: 0,
    latest: 0
  }),
  importComplete: false
})

state.peerSequences(console.log)

watch(throttle(state.peersLatestSequence, 1000), console.log)

// Note you can't want state and get updates to mySequence!
watch(throttle(state, 500), s => {
  const myFeedSynced = s.mySequence.current >= s.mySequence.latest && s.mySequence.latestConfirmed
  const enoughFriends = s.peerSequences.current > 0.95 * s.peerSequences.latest

  if (myFeedSynced && enoughFriends) state.importComplete.set(true)
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
      watch(state.importComplete, importComplete => {
        if (importComplete) electron.ipcRenderer.send('import-completed')
      })

      if (fs.existsSync(SECRET_PATH)) {
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
          state.mySequence.latest.set(previousData.mySequence.latest)
          // state.peerSequences.latest.set(previousData.peerSequences.latest) // nor made in exportIdentity yet
          state.isPresentingOptions.set(false)
          manageProgress({ state, config })
        }
      }

      var app = h('App', [
        h('Header', [
          h('img.logoName', { src: assetPath('logo_and_name.png') }),
          windowControls()
        ]),
        when(state.isPresentingOptions, InitialOptions(), ImportProgress())
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
            when(state.creatingNewIdentity,
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
        const { header, myFeedProgress, myFriendsProgress, details } = strings.backup.import

        return h('Page', [
          h('div.content', [
            h('h1', header),
            h('h2', myFeedProgress),
            h('pre', computed(state.mySequence, s => {
              return progress({
                width: 42,
                total: s.latest,
                complete: '/',
                incomplete: '-',
                style: function (complete, incomplete) {
                  // add an arrow at the head of the completed part
                  return `[${complete}${incomplete}] (${s.current}/ ${s.latest})`
                }
              })(s.current)
            })),
            h('p', details),
            h('h2', myFriendsProgress),
            h('pre', computed(state.peerSequences, s => {
              return progress({
                width: 42,
                total: s.latest,
                complete: '\\',
                incomplete: '-',
                style: function (complete, incomplete) {
                  // add an arrow at the head of the completed part
                  return `[${complete}${incomplete}] (${s.current}/ ${Math.max(s.latest, s.current)})`
                }
              })(s.current)
            }))
          ])
        ])
      }
    }
  })
}

electron.ipcRenderer.on('import-resumed', function (ev, c) {
  console.log('background process is running, begin observing')

  manageProgress({ state, config })
})

function actionCreateNewOne () {
  state.creatingNewIdentity.set(true)
  /// //////////!!!!!!
  // WARNING TODO: this needs replacing with manifest exported from actual sbot running!
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json')))
  /// //////////!!!!!!
  if (!fs.existsSync(config.path)) {
    fs.mkdirSync(config.path)
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest))

  electron.ipcRenderer.send('create-new-identity')
}

function actionImportIdentity (strings) {
  /// /////////!!!!!!
  // WARNING TODO (same as above warning)
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../manifest.json')))

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
        const requiredProps = ['secret', 'gossip', 'mySequence', 'peersLatestSequence']

        if (requiredProps.every(prop => data.hasOwnProperty(prop))) {
          if (!fs.existsSync(config.path)) {
            fs.mkdirSync(config.path)
          }

          fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest))
          fs.writeFileSync(GOSSIP_PATH, JSON.stringify(data.gossip), 'utf8')
          fs.writeFileSync(SECRET_PATH, data.secret, 'utf8')

          state.mySequence.latest.set(data.mySequence.latest)
          state.isPresentingOptions.set(false)

          data.importing = true

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
  if (fs.existsSync(IMPORT_PATH)) {
    let data = JSON.parse(fs.readFileSync(IMPORT_PATH))
    return data || false
  } else {
    return false
  }
}

function setImportData (data) {
  fs.writeFileSync(IMPORT_PATH, JSON.stringify(data))
}

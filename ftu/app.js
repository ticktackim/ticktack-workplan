const { h, Value, when } = require('mutant')
const nest = require('depnest')
const path = require('path')
const fs = require('fs')
const { remote } = require('electron')
const insertCss = require('insert-css')
const values = require('lodash/values')
const electron = require('electron')


exports.gives = nest('ftu.app')

exports.needs = nest({
  'styles.css': 'reduce',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest({
    'ftu.app': function app() {

      const strings = api.translations.sync.strings()

      const css = values(api.styles.css()).join('\n')
      insertCss(css)

      var isBusy = Value(false)

      var actionButtons = h('section', [
        h('div.left', h('Button', strings.backup.ftu.importAction)),
        h('div.right', h('Button', { 'ev-click': () => actionCreateNewOne(isBusy) }, strings.backup.ftu.createAction))
      ])

      var busyMessage = h('p', strings.backup.ftu.busyMessage)

      var app = h('App', [
        h('Header', [
          windowControls()
        ]),
        h('Page -ftu', [
          h('div.content', [
            h('h1', strings.backup.ftu.welcomeHeader),
            h('p', strings.backup.ftu.welcomeMessage),
            when(isBusy, busyMessage, actionButtons)
          ])
        ])
      ])

      return app
    }

  })

}

function actionCreateNewOne(isBusy) {
  isBusy.set(true)
  const config = require('../config').create().config.sync.load()
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "../manifest.json")))
  fs.writeFileSync(path.join(config.path, 'manifest.json'), JSON.stringify(manifest))


  electron.ipcRenderer.send('create-new-identity')
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

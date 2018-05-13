const { h, Value } = require('mutant')
const nest = require('depnest')
const path = require('path')
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

      const css = values(api.styles.css()).join('\n')
      insertCss(css)

      var app = h('App', [
        h('Header', [
          windowControls()
        ]),
        h('Page -ftu', [
          h('div.content', [
            h('h1', 'Welcome to Ticktack'),
            h('p', 'Do you want to create a new identity or import one?'),
            h('section', [
              h('div.left', h('Button', 'Import identity')),
              h('div.right', h('Button', { 'ev-click': () => actionCreateNewOne() }, 'Create a new one'))
            ])
          ])
        ])
      ])

      return app
    }

  })

}

function actionCreateNewOne() {
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

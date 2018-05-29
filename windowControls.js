const { h } = require('mutant')
const { remote } = require('electron')
const path = require('path')

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

module.exports = windowControls

function assetPath (name) {
  return path.join(__dirname, 'assets', name)
}

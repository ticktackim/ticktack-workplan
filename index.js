var defaultMenu = require('electron-default-menu')
var WindowState = require('electron-window-state')
var electron = require('electron')
var Menu = electron.Menu
var Path = require('path')

// First-Time User Experience (FTU) needs the items below
const fs = require('fs')
const path = require('path')
const os = require('os')
const appName = process.env.SSB_APPNAME || 'ssb'
const CONFIG_FOLDER = path.join(os.homedir(), `.${appName}`)
const IMPORT_FILE = path.join(CONFIG_FOLDER, 'importing.json')

var windows = {}
var quitting = false

electron.app.on('ready', () => {
  var menu = defaultMenu(electron.app, electron.shell)
  var view = menu.find(x => x.label === 'View')
  view.submenu = [
    { role: 'reload' },
    { role: 'toggledevtools' },
    { type: 'separator' },
    { role: 'resetzoom' },
    { role: 'zoomin' },
    { role: 'zoomout' },
    { type: 'separator' },
    { role: 'togglefullscreen' }
  ]
  if (process.platform === 'darwin') {
    var win = menu.find(x => x.label === 'Window')
    win.submenu = [
      { role: 'minimize' },
      { role: 'zoom' },
      { role: 'close', label: 'Close' },
      { type: 'separator' },
      { role: 'front' }
    ]
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(menu))

  if (!fs.existsSync(Path.join(CONFIG_FOLDER, 'secret'))) {
    console.log('Ticktack or SSB not installed, run FTU')
    openFTUWindow()
  } else {
    startBackgroundProcess()
  }

  // FTU told app to create new identity, so proceed as normal
  electron.ipcMain.once('create-new-identity', function (ev) {
    console.log('create new identity')
    setImportRunningFlag(false)
    startBackgroundProcess()
  })

  // FTU told app to import some identity, need to start sbot and keep FTU running
  electron.ipcMain.once('import-identity', function (ev) {
    console.log('import identity')
    setImportRunningFlag(true)
    startBackgroundProcess()
  })

  // FTU import finished, ready to start main window
  electron.ipcMain.once('import-completed', function (ev) {
    console.log('> import finished, opening main window')
    setImportRunningFlag(false)
    openMainWindow()
  })

  // wait until server has started before opening main window
  electron.ipcMain.once('server-started', function (ev, config) {
    let keepFTURunning = getImportRunningFlag(false)
    if (!keepFTURunning) {
      console.log('> Opening main window')
      openMainWindow()
    } else {
      // sbot started but we're importing an older identity, need
      // to tell FTU to wait for sync.
      openFTUWindow()
      windows.ftu.webContents.send('import-resumed')
    }
  })

  electron.app.on('before-quit', function () {
    quitting = true
  })

  // allow inspecting of background process
  electron.ipcMain.on('open-background-devtools', function (ev, config) {
    if (windows.background) {
      windows.background.webContents.openDevTools({ detach: true })
    }
  })
})

function startBackgroundProcess () {
  if (!windows.background) {
    windows.background = openWindow(Path.join(__dirname, 'background-process.js'), {
      connect: false,
      center: true,
      fullscreen: false,
      fullscreenable: false,
      height: 150,
      maximizable: false,
      minimizable: false,
      resizable: false,
      show: false,
      skipTaskbar: true,
      title: 'ticktack-server',
      useContentSize: true,
      width: 150
    })
  }
}

function openMainWindow () {
  if (!windows.main) {
    var windowState = WindowState({
      defaultWidth: 1024,
      defaultHeight: 768
    })
    windows.main = openWindow(Path.join(__dirname, 'main.js'), {
      minWidth: 800,
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
      autoHideMenuBar: true,
      title: 'Ticktack',
      frame: false,
      titleBarStyle: 'hidden',
      show: true,
      backgroundColor: '#EEE',
      icon: './assets/icon.png'
    })
    windowState.manage(windows.main)
    windows.main.setSheetOffset(40)
    windows.main.on('close', function (e) {
      if (!quitting && process.platform === 'darwin') {
        e.preventDefault()
        windows.main.hide()
      }
    })
    windows.main.on('closed', function () {
      windows.main = null
      if (process.platform !== 'darwin') electron.app.quit()
    })

    if (windows.ftu) {
      windows.ftu.hide()
    }
  }
}

function openFTUWindow () {
  if (!windows.ftu) {
    var windowState = WindowState({
      defaultWidth: 1024,
      defaultHeight: 768
    })
    windows.ftu = openWindow(Path.join(__dirname, 'ftu', 'index.js'), {
      minWidth: 800,
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
      autoHideMenuBar: true,
      title: 'Ticktack',
      frame: false,
      titleBarStyle: 'hidden',
      show: true,
      backgroundColor: '#EEE',
      icon: './assets/icon.png'
    })
    windowState.manage(windows.ftu)
    windows.ftu.setSheetOffset(40)
    windows.ftu.on('close', function (e) {
      if (!quitting && process.platform === 'darwin') {
        e.preventDefault()
        windows.ftu.hide()
      }
    })
    windows.ftu.on('closed', function () {
      windows.ftu = null
      if (process.platform !== 'darwin') electron.app.quit()
    })
  }
}

function openWindow (path, opts) {
  var window = new electron.BrowserWindow(opts)
  window.webContents.on('dom-ready', function () {
    window.webContents.executeJavaScript(`
      var electron = require('electron')
      var h = require('mutant/h')
      electron.webFrame.setZoomLevelLimits(1, 1)
      var title = ${JSON.stringify(opts.title || 'Ticktack')}
      document.documentElement.querySelector('head').appendChild(
        h('title', title)
      )
      require(${JSON.stringify(path)})
    `)
  })

  window.webContents.on('will-navigate', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  window.webContents.on('new-window', function (e, url) {
    e.preventDefault()
    electron.shell.openExternal(url)
  })

  window.loadURL('file://' + Path.join(__dirname, 'assets', 'base.html'))
  return window
}

function getImportRunningFlag (defaultValue) {
  if (fs.existsSync(IMPORT_FILE)) {
    let data = JSON.parse(fs.readFileSync(IMPORT_FILE))
    return data.importing || defaultValue
  } else {
    return defaultValue
  }
}

function setImportRunningFlag (v) {
  let data = {}
  if (fs.existsSync(IMPORT_FILE)) {
    data = JSON.parse(fs.readFileSync(IMPORT_FILE))
  }

  data.importing = v

  fs.writeFileSync(IMPORT_FILE, JSON.stringify(data))
}

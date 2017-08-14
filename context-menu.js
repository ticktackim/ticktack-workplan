const electron = require('electron')
const remote = electron.remote
const Menu = remote.Menu

var rightClickPosition = null

const menu = Menu.buildFromTemplate([
  { label: 'Inspect Element',
    click: () => {
      remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y)
    }
  },
  { label: 'Inspect Background Process',
    click: () => {
      electron.ipcRenderer.send('open-background-devtools')
    }
  }
])

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  rightClickPosition = {x: e.x, y: e.y}
  menu.popup(remote.getCurrentWindow(), {async: true})
}, false)

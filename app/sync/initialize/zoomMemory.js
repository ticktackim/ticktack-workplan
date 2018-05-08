const nest = require('depnest')
const electron = require('electron')

exports.gives = nest('app.sync.initialize')

exports.needs = nest({
  'settings.sync.get': 'first',
  'settings.sync.set': 'first'
})

exports.create = (api) => {
  return nest('app.sync.initialize', zoomMemory)

  function zoomMemory () {
    console.log('> initialise: window form')
    const { getCurrentWebContents, getCurrentWindow } = electron.remote

    window.addEventListener('resize', () => {
      var wc = getCurrentWebContents()
      wc && wc.getZoomFactor(zf => {
        console.log(zf)
        api.settings.sync.set({
          ticktack: {
            electron: {
              zoomFactor: zf,
              windowBounds: getCurrentWindow().getBounds()
            }
          }
        })
      })
    })

    var zoomFactor = api.settings.sync.get('ticktack.electron.zoomFactor')
    if (zoomFactor) { getCurrentWebContents().setZoomFactor(zoomFactor) }

    var bounds = api.settings.sync.get('ticktack.electron.windowBounds')
    if (bounds) { getCurrentWindow().setBounds(bounds) }
  }
}

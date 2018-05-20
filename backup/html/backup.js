const nest = require('depnest')
const { h, Value, resolve } = require('mutant')
const { dialog } = require('electron').remote;
const path = require('path')
const fs = require('fs')

exports.gives = nest({
  'backup.html': ['exportIdentityButton']
})

exports.needs = nest({
  'app.html.lightbox': 'first',
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first',
  'backup.async.exportIdentity': 'first'
})

exports.create = (api) => {
  return nest('backup.html.exportIdentityButton', () => {

    const strings = api.translations.sync.strings()

    function exportAction() {
      let feedFragment = api.keys.sync.id().slice(1, 6)
      dialog.showSaveDialog(
        {
          title: strings.backup.export.dialog.title,
          butttonLabel: strings.backup.export.dialog.label,
          defaultPath: `ticktack-identity-${feedFragment}.backup`,
        },
        (filename) => api.backup.async.exportIdentity(filename, () => console.log('exported'))
      )
    }

    return h('div.backupKeys', [
      h('Button -backup', { 'ev-click': exportAction }, strings.backup.export.exportAction)
    ])
  })
}

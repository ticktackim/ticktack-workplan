const nest = require('depnest')
const { h, Value, computed } = require('mutant')
const { dialog } = require('electron').remote

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

    const exporting = Value()
    const success = Value()

    function exportAction () {
      exporting.set(true)
      success.set() // the resets the tick if there are multiple backup exports done

      let feedFragment = api.keys.sync.id().slice(1, 6)
      dialog.showSaveDialog(
        {
          title: strings.backup.export.dialog.title,
          butttonLabel: strings.backup.export.dialog.label,
          defaultPath: `ticktack-identity-${feedFragment}.backup`
        },
        (filename) => api.backup.async.exportIdentity(filename, (err, res) => {
          exporting.set(false)
          if (err) {
            console.error(err)
            success.set(false)
          } else {
            console.log('exported')
            success.set(true)
          }
        })
      )
    }

    return h('div.backupKeys', [
      h('Button -backup', { 'ev-click': exportAction }, strings.backup.export.exportAction),
      computed([exporting, success], (exporting, success) => {
        if (success === true) return h('i.fa.fa-check')
        if (success === false) return h('i.fa.fa-times')

        if (exporting) return h('i.fa.fa-spinner.fa-pulse')
      })
    ])
  })
}

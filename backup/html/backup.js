const nest = require('depnest')
const { h, computed, Value, resolve } = require('mutant')
const electron = require('electron')
const { dialog } = require('electron').remote;
const path = require('path')
const fs = require('fs')

exports.gives = nest({
  'backup.html': ['exportIdentityButton', 'importIdentityButton']
})

exports.needs = nest({
  'app.html.lightbox': 'first',
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first',
  'backup.async.exportIdentity': 'first'
})

exports.create = (api) => {
  return nest('backup.html', { exportIdentityButton, importIdentityButton })

  function exportIdentityButton() {
    const strings = api.translations.sync.strings()

    let isOpen = Value(false)
    let encryptionKeyRaw = Value('')

    let encryptionKeyInput = h('textarea#encryptionKey', {
      style: {
        width: '90%'
      },
      placeholder: strings.backup.export.passwordPlaceholder,
      value: encryptionKeyRaw,
      'ev-input': () => encryptionKeyRaw.set(encryptionKeyInput.value),
    })

    let exportDialog = h('div.dialog', {
      style: {
        'text-align': 'left'
      }
    },
      [
        h('div.message', [
          h('h1', strings.backup.export.header),
          h('p', strings.backup.export.message[0]),
          h('p', strings.backup.export.message[1])
        ]),
        h('div.form', [
          encryptionKeyInput
        ]),
        h('div.actions', [
          h('Button', { 'ev-click': () => isOpen.set(false) }, strings.backup.export.cancelAction),
          h('Button -primary', {
            'ev-click': () => {
              dialog.showSaveDialog(
                {
                  title: strings.backup.export.dialog.title,
                  butttonLabel: strings.backup.export.dialog.label,
                  defaultPath: 'ticktack-identity.backup',
                },
                (filename) => api.backup.async.exportIdentity(
                  resolve(encryptionKeyRaw), filename, () => isOpen.set(false)
                )
              )
            }
          }, strings.backup.export.exportAction)
        ])
      ])

    let lb = api.app.html.lightbox(exportDialog, isOpen)

    return h('div.backupKeys', [
      h('Button -backup', { 'ev-click': () => isOpen.set(true) }, strings.backup.export.exportAction),
      lb
    ])
  }

  function importIdentityButton() {
    const strings = api.translations.sync.strings()

    return h('div.backupKeys', [
      h('Button -backup', strings.backup.import.importAction)
    ])
  }
}

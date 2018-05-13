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

  let strings = api.translations.sync.strings()

  function exportIdentityButton() {
    let isOpen = Value(false)
    let encryptionKeyRaw = Value('')

    let encryptionKeyInput = h('textarea#encryptionKey', {
      style: {
        width: '90%'
      },
      placeholder: 'Please enter password to protect export file',
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
          h('h1', 'Export Identity'),
          h('p', 'Please backup your private key file very carefully.'),
          h('p', 'If your private key is hacked, all your private messages will be retrieved by third party, and your identity will be faked on the network')
        ]),
        h('div.form', [
          encryptionKeyInput
        ]),
        h('div.actions', [
          h('Button', { 'ev-click': () => isOpen.set(false) }, 'Cancel'),
          h('Button -primary', {
            'ev-click': () => {
              dialog.showSaveDialog(
                {
                  title: 'Export Identity',
                  butttonLabel: 'Export Identity',
                  defaultPath: 'ticktack-identity.backup',
                },
                (filename) => api.backup.async.exportIdentity(
                  resolve(encryptionKeyRaw), filename, () => isOpen.set(false)
                )
              )
            }
          }, 'Export Identity')
        ])
      ])

    let lb = api.app.html.lightbox(exportDialog, isOpen)

    return h('div.backupKeys', [
      h('Button -backup', { 'ev-click': () => isOpen.set(true) }, 'Export Keys'),
      lb
    ])
  }

  function importIdentityButton() {
    return h('div.backupKeys', [
      h('Button -backup', 'Import Keys')
    ])
  }
}

const nest = require('depnest')
const { h, computed, Value } = require('mutant')
const electron = require('electron')
const path = require('path')
const fs = require('fs')

exports.gives = nest({
  'backup.html': ['exportIdentityButton', 'importIdentityButton']
})

exports.needs = nest({
  'app.html.lightbox': 'first',
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest('backup.html', { exportIdentityButton, importIdentityButton })

  let feed = api.keys.sync.id()
  let strings = api.translations.sync.strings()

  function exportIdentityButton() {
    let isOpen = Value(false)
    let encryptionKeyRaw = Value('')
    let msg = "Your identity is represented by an ed25519 key pair. Please backup your private key file very carefully. If your private key is hacked, all your private messages will be retrieved by third party, and your identity will be faked on the network"
    let encryptionKeyInput = h('textarea#encryptionKey', {
      style: {
        width: '90%'
      },
      placeholder: 'Please enter password to protect export file',
      value: encryptionKeyRaw,
      'ev-input': () => encryptionKeyRaw.set(encryptionKeyInput.value),
    })

    let dialog = h('div.dialog', [
      h('div.message', [
        h('p', msg),
      ]),
      h('div.form', [
        encryptionKeyInput
      ]),
      h('div.actions', [
        h('Button', { 'ev-click': () => isOpen.set(false) }, 'Cancel'),
        h('Button -primary', { 'ev-click': () => exportKey(resolve(encryptionKeyRaw), () => isOpen.set(false)) }, 'Export Keys')
      ])
    ])

    let lb = api.app.html.lightbox(dialog, isOpen)

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

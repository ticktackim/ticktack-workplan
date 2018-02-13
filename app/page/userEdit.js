const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.userEdit')

exports.needs = nest({
  'about.page.edit': 'first',
  'history.sync.push': 'first',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest('app.page.userEdit', userEdit)

  function userEdit (location) {
    // location is an object { feed, page: 'userEdit', callback }
    var { feed, callback } = location

    const strings = api.translations.sync.strings()

    const options = Object.assign({}, location, {
      feed,
      labels: {
        avatar: strings.userEdit.section.avatar,
        name: strings.userEdit.section.name,
        description: strings.userEdit.section.introduction,
        instructionCrop: strings.userEdit.instruction.crop,
        okay: strings.userEdit.action.okay,
        cancel: strings.userEdit.action.cancel,
        save: strings.userEdit.action.save
      }
    })

    const defaultCallback = (err, didEdit) => {
      if (err) throw new Error('Error editing profile', err)

      api.history.sync.push({ page: 'userShow', feed })
    }
    callback = typeof callback === 'function'
      ? callback
      : defaultCallback

    return h('Page -userEdit', {}, [
      h('div.content', [
        api.about.page.edit(options, callback)
      ])
    ])
  }
}

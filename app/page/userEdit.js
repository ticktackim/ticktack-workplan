const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.page.userEdit')

exports.needs = nest({
  'about.page.edit': 'first',
  'history.sync.push': 'first',
  'translations.sync.strings': 'first',
})

exports.create = (api) => {
  return nest('app.page.userEdit', userEdit)

  function userEdit (location) {
    // location is an object { feed, page: 'userEdit' } 

    const strings = api.translations.sync.strings()

    const options = Object.assign({}, location, {
      name: strings.userEdit.section.name,
      image: strings.userEdit.section.image,
      cancel: strings.userEdit.action.cancel,
      save: strings.userEdit.action.save,
    })

    const callback = (err, didEdit) => {
      if (err) throw new Error ('Error editing profile', err) 

      api.history.sync.push({ page: 'userShow', feed })
    }

    return h('Page -userEdit', {}, [
      h('div.container', [
        api.about.page.edit(options, callback)
      ])
    ])
  }
}


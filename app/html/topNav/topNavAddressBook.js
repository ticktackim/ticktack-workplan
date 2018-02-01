const nest = require('depnest')
const { h, computed, when } = require('mutant')
const get = require('lodash/get')

exports.gives = nest('app.html.topNav')

exports.needs = nest({
  'translations.sync.strings': 'first',
})

exports.create = (api) => {
  return nest('app.html.topNav', (location, input) => {
    if (location.page !== 'addressBook') return 

    const strings = api.translations.sync.strings()

    return h('TopNav -addressBook', [
      h('div.search', [
        h('i.fa.fa-search'),
        h('input', { 
          placeholder: strings.addressBook.action.find[location.section],
          autofocus: 'autofocus',
          'ev-input': e => input.set(e.target.value) 
        }),
      ])
    ])
  })
}


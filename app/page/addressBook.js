const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')

exports.gives = nest('app.page.addressBook')

exports.needs = nest({
  'app.html.blogNav': 'first',
  // 'app.html.scroller': 'first',
  'app.html.sideNav': 'first',
  'contact.obs.relationships': 'first',
  'history.sync.push': 'first',
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first',
})

exports.create = (api) => {
  return nest('app.page.addressBook', function (location) {
    // location here can expected to be: { page: 'addressBook'}
 
    const strings = api.translations.sync.strings()
    const myKey = api.keys.sync.id()
    const relationships = api.contact.obs.relationships(myKey)

    

    return h('Page -addressBook', [
      api.app.html.sideNav(location, relationships),
      '//// content here ////'
    ])
  })
}


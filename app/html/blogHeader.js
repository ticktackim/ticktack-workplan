const nest = require('depnest')
const { h, computed, when } = require('mutant')
const get = require('lodash/get')

exports.gives = nest('app.html.blogHeader')

exports.needs = nest({
  'app.html.link': 'first',
  'translation.sync.strings': 'first',
})

exports.create = (api) => {
  return nest('app.html.blogHeader', (location) => {
    const strings = api.translation.sync.strings()
    const Link = api.app.html.link

    if (location.page === 'blogShow') {
      return h('div.left', Link())


    }

    return h('BlogHeader', [

    ])
  })
}


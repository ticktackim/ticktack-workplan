const nest = require('depnest')
const { h, computed, when } = require('mutant')
const get = require('lodash/get')

exports.gives = nest('app.html.topNav')

exports.needs = nest({
  'history.sync.back': 'first',
  'translations.sync.strings': 'first',
})

exports.create = (api) => {
  return nest('app.html.topNav', (location) => {
    // const strings = api.translations.sync.strings()
    const back = () => api.history.sync.back()

    return h('TopNav -back', [
      h('div.left', [ 
        h('div', { 'ev-click': back }, [ 
          h('i.fa.fa-chevron-left'),
          // strings.blogIndex.title
        ]),
      ]),
      h('div.right', [ 
      ])
    ])
  })
}


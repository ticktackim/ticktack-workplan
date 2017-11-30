const nest = require('depnest')
const { h, computed, when } = require('mutant')
const get = require('lodash/get')

exports.gives = nest('app.html.blogHeader')

exports.needs = nest({
  'history.sync.push': 'first',
  'translations.sync.strings': 'first',
})

exports.create = (api) => {
  return nest('app.html.blogHeader', (location) => {
    const strings = api.translations.sync.strings()
    const goTo = (loc) => () => api.history.sync.push(loc)

    if (location.page === 'blogIndex' || location.page === 'blogSearch') {
      return h('BlogHeader', [
        h('div.left', [ 
          h('div', { 
            className: location.page === 'blogIndex' ? '-active' : '',
            'ev-click': goTo({ page: 'blogIndex' }) 
          }, strings.blogHeader.blogsAll),
          h('div', { 
            className: location.page === 'blogSearch' ? '-active' : '',
            'ev-click': goTo({ page: 'blogSearch' }) 
          }, strings.blogHeader.blogSearch),
        ]),
        h('div.right', [ 
          h('Button -primary', { 'ev-click': () => api.history.sync.push({ page: 'blogNew' }) }, strings.blogNew.actions.writeBlog),
        ])
      ])
    }

    return h('BlogHeader', [
      h('div.left', [ 
        h('div.-discovery', { 'ev-click': goTo({ page: 'blogIndex' }) }, [ 
          h('i.fa.fa-chevron-left'),
          strings.blogIndex.title
        ]),
      ]),
      h('div.right', [ 
      ])
    ])
  })
}


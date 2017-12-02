const nest = require('depnest')
const { h, computed, when } = require('mutant')
const get = require('lodash/get')

exports.gives = nest('app.html.blogNav')

exports.needs = nest({
  'history.sync.push': 'first',
  'translations.sync.strings': 'first',
})

exports.create = (api) => {
  return nest('app.html.blogNav', (location) => {
    const strings = api.translations.sync.strings()
    const goTo = (loc) => () => api.history.sync.push(loc)

    if (location.page === 'blogIndex' || location.page === 'blogSearch') {
      return h('BlogNav', [
        h('div.left', [ 
          h('div', { 
            className: location.page === 'blogIndex' ? '-active' : '',
            'ev-click': goTo({ page: 'blogIndex' }) 
          }, strings.blogNav.blogsAll),
          h('div', { 
            className: location.page === 'blogSearch' ? '-active' : '',
            'ev-click': goTo({ page: 'blogSearch' }) 
          }, strings.blogNav.blogSearch),
        ]),
        h('div.right', [ 
          h('Button -strong', { 'ev-click': () => api.history.sync.push({ page: 'blogNew' }) }, strings.blogNew.actions.writeBlog),
        ])
      ])
    }

    return h('BlogNav', [
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


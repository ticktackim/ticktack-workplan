const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.html.topNav')

exports.needs = nest({
  'history.sync.push': 'first',
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest('app.html.topNav', (location) => {
    const strings = api.translations.sync.strings()
    const goTo = (loc) => () => api.history.sync.push(loc)

    if (!['blogIndex', 'blogSearch'].includes(location.page)) return

    const activeFilter = location.hasOwnProperty('filter') ? location.filter : "All"

    var filters = () => {
      return h('Filters', [
        h('span -filter', {
          className: 'All' === activeFilter ? '-active' : '',
          'ev-click': goTo({ page: location.page, filter: 'All' })
        }, 'All'),
        h('span', '|'),
        h('span -filter', {
          className: 'Subscriptions' === activeFilter ? '-active' : '',
          'ev-click': goTo({ page: location.page, filter: 'Subscriptions' })
        }, 'Subscriptions'),
        h('span', '|'),
        h('span -filter', {
          className: 'Friends' === activeFilter ? '-active' : '',
          'ev-click': goTo({ page: location.page, filter: 'Friends' })
        }, 'Friends')
      ])
    }

    return [h('TopNav -blog', [
      h('div.left', [
        h('div', {
          className: location.page === 'blogIndex' ? '-active' : '',
          'ev-click': goTo({ page: 'blogIndex' })
        }, strings.topNav.blogsAll),
        h('div', {
          className: location.page === 'blogSearch' ? '-active' : '',
          'ev-click': goTo({ page: 'blogSearch' })
        }, strings.topNav.blogSearch)
      ]),
      h('div.right', [
        h('Button -strong', { 'ev-click': () => api.history.sync.push({ page: 'blogNew' }) }, strings.blogNew.actions.writeBlog)
      ])
    ]),
      filters
    ]
  })
}

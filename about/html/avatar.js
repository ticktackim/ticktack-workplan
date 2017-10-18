const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('about.html.avatar')

exports.needs = nest({
  'about.obs.imageUrl': 'first',
  'about.obs.color': 'first',
  'history.sync.push': 'first'
})

exports.create = function (api) {
  return nest('about.html.avatar', function (id, size = 'small') {
    return h('img', {
      classList: `Avatar -${size}`,
      style: { 'background-color': api.about.obs.color(id) },
      src: api.about.obs.imageUrl(id),
      title: id,
      'ev-click': () => api.history.sync.push({ page: 'userShow', feed: id })
    })
  })
}


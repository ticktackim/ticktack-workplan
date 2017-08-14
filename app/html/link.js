const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest('app.html.link')

exports.needs = nest({
  'history.sync.push': 'first',
})

exports.create = (api) => {
  return nest('app.html.link', (location, body) => {
    return h('Link', { 
      'ev-click': () => api.history.sync.push(location)
    }, body)
  })
}


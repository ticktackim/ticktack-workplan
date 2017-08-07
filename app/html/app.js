const nest = require('depnest')
const { h } = require('mutant')


exports.gives = nest('app.html.app')

exports.create = (api) => {
  return nest('app.html.app', app)

  function app () {
    return h('h1', 'Hello!')


  }
}


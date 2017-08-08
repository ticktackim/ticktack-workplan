const nest = require('depnest')
const values = require('lodash/values')
const insertCss = require('insert-css')

exports.gives = nest('app.html.app')

exports.needs = nest({
  'app.sync.goTo': 'first',
  'styles.css': 'first'
})

exports.create = (api) => {
  return nest('app.html.app', app)

  function app () {
    const css = values(api.styles.css()).join('\n')
    insertCss(css)

    // return api.app.sync.goTo({ page: 'home' })
    return api.app.sync.goTo({key: "%fXXZgQrwnj7F+Y19H0IXxNriuvPFoahvusih3UzpkfA=.sha256"})
  }
}

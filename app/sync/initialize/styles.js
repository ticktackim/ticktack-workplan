const nest = require('depnest')
const insertCss = require('insert-css')
const values = require('lodash/values')

exports.gives = nest('app.sync.initialize')

exports.needs = nest({
  'styles.css': 'reduce'
})

exports.create = (api) => {
  return nest({
    'app.sync.initialize': function initializeStyles () {
      const css = values(api.styles.css()).join('\n')
      insertCss(css)
    }
  })
}


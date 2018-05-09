const nest = require('depnest')
const { h, computed } = require('mutant')
const values = require('lodash/values')

exports.gives = nest('app.sync.initialize')

exports.needs = nest({
  'styles.css': 'reduce',
  'settings.obs.get': 'first'
})

const darkMod = `
body {
  filter: invert(88%);
}

body .Page img {
  filter: invert();
}
div.Thumbnail {
  filter: invert();
}
body .Lightbox img {
  filter: invert();
}
`

exports.create = (api) => {
  return nest({
    'app.sync.initialize': function initializeStyles () {
      console.log('> initialise: styles')
      const css = values(api.styles.css()).join('\n')

      document.head.appendChild(
        h('style', {
          innerHTML: computed(api.settings.obs.get('ticktack.theme'), theme => {
            return [css, theme === 'dark' ? darkMod : ''].join('\n')
          })
        })
      )
    }
  })
}

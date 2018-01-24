const nest = require('depnest')
const { h, computed, when, Value } = require('mutant')

exports.gives = nest('app.html.lightbox')

exports.create = (api) => {
  return nest('app.html.lightbox', (content, isOpen) => {

    function closeMe() {
      isOpen.set(false)
    }

    return h('Lightbox', {className: when(isOpen, '-open', '-close'), 'ev-click': () => closeMe() },
      h('Content', [
        content
      ]))
  })
}


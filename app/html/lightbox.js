const nest = require('depnest')
const { h, computed, when, Value } = require('mutant')

exports.gives = nest('app.html.lightbox')

exports.create = (api) => {
  return nest('app.html.lightbox', (content, isOpen) => {

    if (typeof isOpen !== 'function') isOpen = Value(false)

    const closeMe = () => isOpen.set(false)


    const lb = h('Lightbox', { className: when(isOpen, '-open', '-close'), 'ev-click': closeMe },
      h('div.content', {'ev-click': (ev) => ev.stopPropagation()},[
        content
      ]))

    lb.close = closeMe

    return lb
  })
}


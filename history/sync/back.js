const nest = require('depnest')
const last = require('lodash/last')

exports.gives = nest('history.sync.back')

exports.needs = nest({
  'history.obs.store': 'first',
  'router.sync.router': 'first'
})

exports.create = (api) => {
  return nest('history.sync.back', back)

  function back () {
    const history = api.history.obs.store()
    if (history().length === 1) return false

    history.pop()
    const location = last(history())
    
    const newView = api.router.sync.router(location)
    renderPage(newView)
  }
}

function renderPage (newView) { 
  const oldView = document.body.firstChild
  oldView
    ? document.body.replaceChild(newView, oldView)
    : document.body.appendChild(newView)
}

const nest = require('depnest')

exports.gives = nest('history.sync.push')

exports.needs = nest({
  'history.obs.store': 'first',
  'router.sync.router': 'first'
})

exports.create = (api) => {
  return nest('history.sync.push', push)

  function push (location) {
    const newView = api.router.sync.router(location)

    if (!newView) return

    api.history.obs.store().push(location)

    renderPage(newView)
  }
}

function renderPage (newView) { 
  const oldView = document.body.firstChild
  oldView
    ? document.body.replaceChild(newView, oldView)
    : document.body.appendChild(newView)

}

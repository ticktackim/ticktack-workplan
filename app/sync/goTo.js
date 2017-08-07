const nest = require('depnest')

exports.gives = nest('app.sync.goTo')

exports.needs = nest({
  'router.sync.router': 'first'
})

exports.create = (api) => {
  return nest('app.sync.goTo', goTo)

  function goTo (location) {
    console.log('goTo', location)
    const newView = api.router.sync.router(location)

    // TODO (mix) : change once history in place
    const oldView = document.body.firstChild
    oldView
      ? document.body.replaceChild(newView, oldView)
      : document.body.appendChild(newView)
  }
}

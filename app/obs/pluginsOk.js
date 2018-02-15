const nest = require('depnest')
const { h, onceTrue, Value } = require('mutant')

exports.gives = nest('app.obs.pluginsOk')

exports.needs = nest({
  'sbot.obs.connection': 'first'
})

exports.create = (api) => {
  var ok = Value()

  return nest('app.obs.pluginsOk', function pluginsOk () {
    if (ok() == undefined) checkForTrouble()

    return ok
  })

  function checkForTrouble () {
    onceTrue(
      api.sbot.obs.connection,
      sbot => {
        if (!sbot.channel) ok.set(false) // TODO could build a list of missing plugins + effects
        else ok.set(true)
      }
    )
  }
}


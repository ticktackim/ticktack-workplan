const nest = require('depnest')
const { h, onceTrue, Value } = require('mutant')

exports.gives = nest('app.obs.pluginWarnings')

exports.needs = nest({
  'sbot.obs.connection': 'first'
})

exports.create = (api) => {
  var warnings = Value()

  return nest('app.obs.pluginWarnings', function warning () {
    if (warnings() == undefined) checkForTrouble()

    return warnings
  })

  function checkForTrouble () {
    onceTrue(
      api.sbot.obs.connection,
      sbot => {
        console.log('nope', sbot.channel)
        if (!sbot.channel) warnings.set(true) // TODO could build a list of missing plugins + effects
        else warnings.set(false)
      }
    )
  }
}


const nest = require('depnest')
const { onceTrue, Value } = require('mutant')

exports.gives = nest('app.obs.pluginsOk')

exports.needs = nest({
  'sbot.obs.connection': 'first'
})

exports.create = (api) => {
  // TODO - differentiate and enable / disable based on channel || ticktack plugin missing
  var ok = Value()

  return nest('app.obs.pluginsOk', function pluginsOk () {
    if (ok() === null) checkForTrouble()

    return ok
  })

  function checkForTrouble () {
    onceTrue(
      api.sbot.obs.connection,
      sbot => {
        if (!sbot.channel) console.log('> channel plugin missing!')
        if (!sbot.tickack) console.log('> ticktack plugin missing!')

        if (!sbot.channel || !sbot.ticktack) ok.set(false) // TODO could build a list of missing plugins + effects
        else ok.set(true)
      }
    )
  }
}

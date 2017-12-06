const nest = require('depnest')

exports.gives = nest('app.sync.initialize')

exports.needs = nest({
  'about.async.suggest': 'first',
  'channel.async.suggest': 'first',
  // 'channel.obs.recent': 'first'
})

exports.create = (api) => {
  var nav = null

  return nest({
    'app.sync.initialize': function initializeSuggests () {
      api.about.async.suggest()
      api.channel.async.suggest()
      // api.channel.obs.recent()()   TODO - figure out how to initialise this store
    }
  })
}


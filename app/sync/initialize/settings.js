const nest = require('depnest')
const merge = require('lodash/merge')

exports.gives = nest('app.sync.initialize')

exports.needs = nest({
  'settings.sync.set': 'first',
  'settings.sync.get': 'first'
})

const defaults = {
  onboarded: false,
  language: 'en',
  ticktack: {
    websharemetrics: 'public',
    electron: {
      zoomFactor: 1
    }
  }
}

exports.create = function (api) {
  return nest('app.sync.initialize', initialiseSettings)

  function initialiseSettings () {
    console.log('> initialise: default settings')
    const { get, set } = api.settings.sync
    const settings = merge({}, defaults, get())

    set(settings)
  }
}

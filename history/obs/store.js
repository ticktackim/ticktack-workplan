const nest = require('depnest')
const { Array: MutantArray } = require('mutant')

exports.gives = nest('history.obs.store')

var _store = MutantArray()

exports.create = (api) => {
  return nest('history.obs.store', () => _store)
}


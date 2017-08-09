const nest = require('depnest')
const readDirectory = require('read-directory')
const path = require('path')
const { basename } = path
const { each } = require('libnested')

const contents = readDirectory.sync(path.join(__dirname, '..'), {
  extensions: false,
  filter: '**/*.mcss',
  ignore: '**/node_modules/**'
})

exports.gives = nest('styles.mcss')

exports.create = function (api) {
  return nest('styles.mcss', mcss)

  function mcss (sofar = {}) {
    each(contents, (content, [filename]) => {
      const name = basename(filename)
      sofar[name] = content
    })
    return sofar
  }
}

const nest = require('depnest')
const { assign } = Object

exports.gives = nest('styles.mixins')

exports.create = (api) => {
  return nest('styles.mixins', (sofar = {}) => {
    return assign(sofar, { mainMixins })
  })
}

const mainMixins = `
$colorPrimary {
  color: green
}

$colorSubtle {
  color: gray
}

$avatarSmall {
  width: 32px
  height: 32px
}

$avatarLarge {
  width: 56px
  height: 56px
}
`



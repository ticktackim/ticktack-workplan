const nest = require('depnest')
const { assign } = Object

exports.gives = nest('styles.mixins')

exports.create = (api) => {
  return nest('styles.mixins', (sofar = {}) => {
    return assign(sofar, { mainMixins })
  })
}

const mainMixins = `
$primaryColor {
  color: white
  background-color: #3dc8c3
}

$colorSubtle {
  color: #222
}

$smallAvatar {
  width: 3rem
  height: 3rem
  border-radius: 1.5rem
}

$largeAvatar {
  width: 6rem
  height: 6rem
  border-radius: 3rem
}
`

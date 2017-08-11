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

$primaryBackground {
  background-color: #f7f7f7
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

$smallMarkdown {
  div.Markdown {
    h1, h2, h3, h4, h5, h6, p {
      font-size: 1rem
      font-weight: 300
      margin: 0
    }
  }
}

$largeMarkdown {
  div.Markdown {
    h1, h2, h3, h4, h5, h6, p {
      font-size: 1.2rem
      font-weight: 300
      margin: 0
    }
  }
}

$roundLeft {
  border-top-left-radius: .9rem
  border-bottom-left-radius: .9rem
}

$roundRight {
  border-top-right-radius: .9rem
  border-bottom-right-radius: .9rem
}

$roundTop {
  border-top-left-radius: .9rem
  border-top-right-radius: .9rem
}

$roundBottom {
  border-bottom-left-radius: .9rem
  border-bottom-right-radius: .9rem
}
`

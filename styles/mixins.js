const nest = require('depnest')
const { assign } = Object

exports.gives = nest('styles.mixins')

exports.create = (api) => {
  return nest('styles.mixins', (sofar = {}) => {
    return assign(sofar, { mainMixins })
  })
}

const mainMixins = `
$fontBasic {
  font-family: arial
  font-size: 1rem
}

$maxWidth {
  max-width: 1200px
}

$colorPrimary {
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

$markdownSmall {
  div.Markdown {
    h1, h2, h3, h4, h5, h6, p {
      font-size: 1rem
      font-weight: 300
      margin: 0
    }
  }
}

$markdownLarge {
  div.Markdown {
    h1, h2, h3, h4, h5, h6, p {
      font-size: 1.2rem
      font-weight: 300
      margin: 0
    }
  }
}

$markdownBold {
  div.Markdown {
    h1, h2, h3, h4, h5, h6, p {
      font-weight: bold
    }
  }
}

$borderSubtle {
  border: 1px solid #b9b9b9
}

$roundLeft {
  border-top-left-radius: 1.2rem
  border-bottom-left-radius: 1.2rem
}

$roundRight {
  border-top-right-radius: 1.2rem
  border-bottom-right-radius: 1.2rem
}

$roundTop {
  border-top-left-radius: 1.2rem
  border-top-right-radius: 1.2rem
}

$roundBottom {
  border-bottom-left-radius: 1.2rem
  border-bottom-right-radius: 1.2rem
}
`

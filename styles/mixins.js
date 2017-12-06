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
  line-height: 1.2
}

$maxWidth {
  max-width: 1000px
}

$maxWidthSmaller {
  max-width: 40rem
}

$colorPrimary {
  color: white
  background-color: #2f63ad

  (a) {
    color: #5c6bc0
  }
}

$colorMessagePrimary {
  background-color: #7eaaea

  (a) {
    color: #0b4fe7
  }
}

$colorFontBasic {
  color: #222
}

$colorFontPrimary {
  color: #2f63ad
}

$colorFontSubtle {
  color: #999
}

$backgroundPrimary {
  background-color: #f5f6f7
}

$backgroundPrimaryText {
  background-color: #fff
}

$backgroundSelected {
  background-color: #f0f1f2
}

$borderPrimary {
  border: 1px #2f63ad solid
}

$circleTiny {
  min-width: 2rem
  min-height: 2rem
  width: 2rem
  height: 2rem
  border-radius: 1rem
}

$circleSmall {
  min-width: 2.8rem
  min-height: 2.8rem
  width: 2.8rem
  height: 2.8rem
  border-radius: 4rem
}

$circleMedium {
  min-width: 3.5rem
  min-height: 3.5rem
  width: 3.5rem
  height: 3.5rem
  border-radius: 4rem
}

$circleLarge {
  min-width: 8rem
  min-height: 8rem
  width: 8rem
  height: 8rem
  border-radius: 8rem
}

$markdownSmall {
  div.Markdown {
    h1, h2, h3, h4, h5, h6, p {
      font-size: .9rem
      font-weight: 300
      margin: 0
    }
    (img.emoji) {
      height: .9rem
    }
  }
  h1, h2, h3, h4, h5, h6, p {
    font-size: .9rem
    font-weight: 300
    margin: 0
  }
  (img.emoji) {
    height: .9rem
  }
}

$markdownLarge {
  div.Markdown {
    h1, h2, h3, h4, h5, h6, p {
      font-size: 1.5rem
      font-weight: 300
      margin: 0
    }
  }
  h1, h2, h3, h4, h5, h6, p {
    font-size: 1.5rem
    font-weight: 300
    margin: 0
  }
  (img.emoji) { 
    height: 1.5rem
  }
}

$markdownBold {
  div.Markdown {
    h1, h2, h3, h4, h5, h6, p {
      font-weight: bold
    }
  }
  h1, h2, h3, h4, h5, h6, p {
    font-weight: bold
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

$code {
  background-color: #f5f5f5
  color: #c121dc
  border: 1px solid #e6e6e6
  border-radius: 2px
}
`

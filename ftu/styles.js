const compile = require('micro-css')

const styles = `
App {
  overflow: hidden
  position: fixed
  top: 0
  bottom: 0
  right: 0
  left: 0
}

Page {
  padding-top: 6.5rem
  margin-top: 0
  height: calc(100%)

  div.content {
    max-width: 35rem
    padding: 2rem
    section {
      display: flex
      align-items: center
      justify-content: center

      div { 
        padding: .5rem

        display: flex
        align-items: center
      }
    }

    section.welcome {
      flex-direction: column
    }
  }
}

Header {
  height: 6.5rem
  background-color: #2f5ea1

  display: initial

  img.logoName {
    margin: 1rem
  }

  div.window-controls {
    position: fixed
    top: 0
    right: 0
    z-index: 100

    display: flex

    img {
      padding: .5rem
      cursor: pointer
      :hover {
        filter: drop-shadow(rgba(255, 255, 255, .5) 0 0 2px)
      }
    }
  }
}
`

module.exports = compile(styles)

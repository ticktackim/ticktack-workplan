const nest = require('depnest')
const { h } = require('mutant')
const path = require('path')

exports.gives = nest('app.page.splash')

exports.needs = nest({
  'translations.sync.strings': 'first'
})

exports.create = (api) => {
  return nest('app.page.splash', splash)

  function splash (location) {
    // location is an object { feed, page: 'splash', callback }

    const strings = api.translations.sync.strings()

    const svg = assetPath('splash.svg')
    console.log(svg)

    const style = {
      'background': require('../../assets/splash-svg.js'),
      'background-repeat': 'no-repeat',
      'background-size': 'contain'
    }

    return h('Splash', [
      h('div.top', [
        h('img.logoName', { src: assetPath('logo_and_name.png') })
      ]),
      h('div.bottom', { style }, [
        h('div.about', random(strings.splash.about)),
        h('pre.slogan', strings.splash.slogan)
      ])
    ])
  }
}

function assetPath (name) {
  return path.join(__dirname, '../../assets', name)
}

function random (arr) {
  const i = Math.floor(Math.random() * arr.length)
  return arr[i]
}


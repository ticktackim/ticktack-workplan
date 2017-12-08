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

    const style = {
      'background-image': assetUrl('splash.svg')
    }

    return h('Splash', [
      // h('div.top'),
      h('div.top', [
        // h('div.logoName', { style: { 'background-image': assetUrl('logo_and_name.png')} } )
        h('img.logoName', { src: assetPath('logo_and_name.png') })
      ]),
      h('div.bottom', { style }, [
        h('div.about', strings.splash.about),
        h('pre.slogan', strings.splash.slogan),
      ])
    ])
  }
}

function assetPath (name) {
  return path.join(__dirname, '../../assets', name)
}

function assetUrl (name) {
  return `url(${assetPath(name)})`
}

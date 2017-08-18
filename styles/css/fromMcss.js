const nest = require('depnest')
const { each, map } = require('libnested')
const compile = require('micro-css')
const { assign } = Object

exports.gives = nest('styles.css')

exports.needs = {
  styles: {
    mcss: 'reduce',
    mixins: 'reduce'
  }
}

exports.create = function (api) {
  return nest('styles.css', css)

  function css (sofar = {}) {
    const mcssObj = api.styles.mcss()
    const mixinObj = api.styles.mixins()

    const mcssMixinsStr = mixinsToMcss(mixinObj)
    const cssObj = mcssToCss(mcssObj, mcssMixinsStr)
    return assign(sofar, cssObj)
  }
}

function mixinsToMcss (mixinsObj) {
  var mcss = ''
  each(mixinsObj, (mixinStr, [name]) => {
    // QUESTION: are mixins mcss specific or should we convert to mcss here?
    // as in, mixins are dom style objects and we use something like `inline-style` package
    mcss += mixinStr + '\n'
  })
  return mcss
}

function mcssToCss (mcssObj, mixinsStr) {
  return map(mcssObj, (mcssStr, [name]) => {
    const newCss = compile(mixinsStr + '\n' + mcssStr)
    if (newCss == '') {
      console.error('Some broken mcss!', { name, mcssStr, mixinsStr })
    }
    return newCss
  })
}

const combine = require('depject')
const entry = require('depject/entry')
const nest = require('depnest')

const ticktack = require('./')
const patchcore = require('patchcore')

// polyfills
require('setimmediate')

// from more specialized to more general
const sockets = combine(
  ticktack,
  patchcore
)

const api = entry(sockets, nest('app.html.app', 'first'))

const app = api.app.html.app()

// TODO (mix) : once goTo/ router is swapping pages, attach the app to the page here
// document.body.appendChild(app)

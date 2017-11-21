const nest = require('depnest')
const Url = require('url')
const { isMsg } = require('ssb-ref')

exports.gives = nest('app.async.catchLinkClick')

exports.needs = nest({
  'sbot.async.get': 'first'
})

exports.create = function (api) {
  return nest('app.async.catchLinkClick', catchLinkClick)

  function catchLinkClick (root, cb) {
    root.addEventListener('click', (ev) => {
      if (ev.target.tagName === 'INPUT' && ev.target.type === 'file') return
      if (ev.defaultPrevented) return // TODO check this is in the right place
      ev.preventDefault()
      ev.stopPropagation()

      var anchor = null
      for (var n = ev.target; n.parentNode; n = n.parentNode) {
        if (n.nodeName === 'A') {
          anchor = n
          break
        }
      }
      if (!anchor) return true

      const href = anchor.getAttribute('href')
      if (!href) return

      const url = Url.parse(href)
      const opts = { 
        isExternal: !!url.host
      }

      if (isMsg(href)) {
        api.sbot.async.get(href, (err, data) => {
          // NOTE the catchLinkClick cb has signature (link, opts)
          cb(err || data, opts)
        })
        return
      }

      cb(href, opts)
    })
  }
}



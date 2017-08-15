const nest = require('depnest')

exports.gives = nest('blob.sync.url')

exports.needs = nest({
  'config.sync.load': 'first'
})

exports.create = function (api) {
  return nest('blob.sync.url', function (id) {
    var config = api.config.sync.load()
    var prefix = config.blobsPrefix != null ? config.blobsPrefix : `http://localhost:${config.ws.port}/blobs/get`
    if (id && typeof id.link === 'string') {
      id = id.link
    }
    return `${prefix}/${encodeURIComponent(id)}`
  })
}

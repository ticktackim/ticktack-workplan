const h = require('mutant/h')
const nest = require('depnest')

exports.needs = nest({
  'sbot.async.publish': 'first'
})

exports.gives = nest('message.async.publish')

exports.create = function (api) {
  return nest('message.async.publish', (content, cb) => {
    api.sbot.async.publish(content, (err, data) => {
      console.log('publish:', err, data)

      cb(err, data)
    })

    return true
  })
}


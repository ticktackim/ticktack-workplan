const nest = require('depnest')
const { h, when, send, resolve, Value, computed } = require('mutant')
const { title } = require('markdown-summary')


exports.gives = nest('message.html.subject')

exports.needs = nest({
  'message.html.markdown': 'first',
})

exports.create = function (api) {
  return nest('message.html.subject', subject)

  function subject (msg) {
    const { subject, text } = msg.value.content
    if(!(subject || text)) return

    return subject
      ? api.message.html.markdown(subject)
      : api.message.html.markdown(title(text))
  }
}

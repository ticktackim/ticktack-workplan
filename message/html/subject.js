const nest = require('depnest')
const { h, when, send, resolve, Value, computed } = require('mutant')

exports.gives = nest('message.html.subject')

exports.needs = nest({
  'message.html.markdown': 'first',
})

exports.create = function (api) {
  return nest('message.html.subject', subject)

  function subject (msg) {
    const { subject, text } = msg.value.content
    if(!(subject || text)) return
    return api.message.html.markdown(firstLine(subject|| text))
  }

  // private

  function firstLine (text) {
    if(text.length < 80 && !~text.indexOf('\n')) return text

    //get the first non-empty line
    var line = text.trim().split('\n').shift().trim()

    //always break on a space, so that links are preserved.
    const leadingMentionsLength = countLeadingMentions(line)
    const i = line.indexOf(' ', leadingMentionsLength + 80)
    var sample = line.substring(0, ~i ? i : line.length)

    const ellipsis = (sample.length < line.length) ? '...' : ''
    return sample + ellipsis
  }

  function countLeadingMentions (str) {
    return str.match(/^(\s*\[@[^\)]+\)\s*)*/)[0].length
    // matches any number of pattern " [@...)  " from start of line
  }

}

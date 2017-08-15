var h = require('mutant/h')
var isString= require('lodash/isString')
var maxBy= require('lodash/maxBy')
var nest = require('depnest')

exports.gives = nest('app.html.threadCard', true)

exports.needs = nest({
  'keys.sync.id': 'first',
  'history.sync.push': 'first',
  'about.obs.name': 'first',
  'about.html.image': 'first',
  'message.html.markdown': 'first',
  'translations.sync.strings': 'first'
})

function firstLine (text) {
  if(text.length < 80 && !~text.indexOf('\n')) return text

  //get the first non-empty line
  var line = text.trim().split('\n').shift().trim()

  //always break on a space, so that links are preserved.
  var i = line.indexOf(' ', 80)
  var sample = line.substring(0, ~i ? i : line.length)

  const ellipsis = (sample.length < line.length) ? '...' : ''
  return sample + ellipsis
}

function trimLeadingMentions (str) {
  return str.replace(/^(\s*\[@[^\)]+\)\s*)*/, '')
  // deletes any number of pattern " [@...)  " from start of line
}

exports.create = function (api) {

  //render the icon for a thread.
  //it would be more depjecty to split this
  //into two methods, one in a private plugin
  //one in a channel plugin
  function threadIcon (msg) {
    if(msg.value.private) {
      const myId = api.keys.sync.id()

      return msg.value.content.recps
        .map(link => isString(link) ? link : link.link)
        .filter(link => link !== myId)
        .map(api.about.html.image)
    }
    else if(msg.value.content.channel)
      return '#'+msg.value.content.channel
  }


  // REFACTOR: move this to a template?
  function buildRecipientNames (thread) {
    const myId = api.keys.sync.id()

    return thread.value.content.recps
      .map(link => isString(link) ? link : link.link)
      .filter(link => link !== myId)
      .map(api.about.obs.name)
  }

  function subject (msg) {
    const { subject, text } = msg.value.content
    if(!(subject || text)) return
    return api.message.html.markdown(firstLine(subject|| text))
  }

  return {app: {html: {threadCard: function (thread, opts = {}) {
    var strings = api.translations.sync.strings()

    if(!thread.value) return
    if(!thread.value.content.text) return

    const subjectEl = h('div.subject', [
      opts.nameRecipients
        ?  h('div.recps', buildRecipientNames(thread).map(recp => h('div.recp', recp)))
        : null,
      subject(thread)
    ])

    const lastReply = thread.replies && maxBy(thread.replies, r => r.timestamp)
    const replySample = lastReply ? subject(lastReply) : null

    const onClick = opts.onClick || function () { api.history.sync.push(thread) }

    return h('div.thread', {'ev-click': onClick }, [
      h('div.context', threadIcon(thread)),
      h('div.content', [
        subjectEl,
        replySample ? h('div.reply', [
          h('div.replySymbol', strings.replySymbol),
          replySample
        ]) : null
      ])
    ])
  }}}}
}



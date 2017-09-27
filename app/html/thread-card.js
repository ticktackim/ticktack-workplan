var nest = require('depnest')
var h = require('mutant/h')
var isString= require('lodash/isString')
var maxBy= require('lodash/maxBy')

exports.gives = nest('app.html.threadCard', true)

exports.needs = nest({
  'keys.sync.id': 'first',
  'history.sync.push': 'first',
  'about.obs.name': 'first',
  'about.html.avatar': 'first',
  'message.html.subject': 'first',
  'translations.sync.strings': 'first',
  'unread.sync.isUnread': 'first'
})

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
        .map(api.about.html.avatar)
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

  return nest('app.html.threadCard', (thread, opts = {}) => {
    var strings = api.translations.sync.strings()
    const { subject } = api.message.html

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
    const id = `${thread.key.replace(/[^a-z0-9]/gi, '')}` //-${JSON.stringify(opts)}`
    // id is only here to help morphdom morph accurately

    var className = thread.unread ? '-unread': ''

    return h('ThreadCard', { id, className }, [
      h('div.context', threadIcon(thread)),
      h('div.content', {'ev-click': onClick}, [
        subjectEl,
        replySample ? h('div.reply', [
          h('i.fa.fa-caret-left'),
          replySample
        ]) : null
      ])
    ])
  })
}



var nest = require('depnest')
var h = require('mutant/h')
var isString= require('lodash/isString')
var maxBy= require('lodash/maxBy')
var humanTime = require('human-time')
var marksum = require('markdown-summary')
var markdown = require('ssb-markdown')
var ref = require('ssb-ref')
var htmlEscape = require('html-escape')

function renderEmoji (emoji, url) {
  if (!url) return ':' + emoji + ':'
  return `
    <img
      src="${htmlEscape(url)}"
      alt=":${htmlEscape(emoji)}:"
      title=":${htmlEscape(emoji)}:"
      class="emoji"
    >
  `
}

exports.gives = nest('app.html.blogCard', true)

exports.needs = nest({
  'keys.sync.id': 'first',
  'history.sync.push': 'first',
  'about.obs.name': 'first',
  'about.html.avatar': 'first',
  'translations.sync.strings': 'first',
  'unread.sync.isUnread': 'first',
  'message.html.markdown': 'first',
  'blob.sync.url': 'first',
  'emoji.sync.url': 'first'
})

exports.create = function (api) {

  //render markdown, but don't support patchwork@2 style mentions or custom emoji right now.
  function render (source) {
    return markdown.block(source, {
      emoji: (emoji) => {
        return renderEmoji(emoji, api.emoji.sync.url(emoji))
      },
      toUrl: (id) => {
        if (ref.isBlob(id)) return api.blob.sync.url(id)
        return id
      },
      imageLink: (id) => id
    })
  }


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

  return nest('app.html.blogCard', (thread, opts = {}) => {
    var strings = api.translations.sync.strings()
    const { subject } = api.message.html

    if(!thread.value) return
    if('string' !== typeof thread.value.content.text) return

    const lastReply = thread.replies && maxBy(thread.replies, r => r.timestamp)

    const onClick = opts.onClick || function () { api.history.sync.push(thread) }
    const id = `${thread.key.replace(/[^a-z0-9]/gi, '')}` //-${JSON.stringify(opts)}`
    // id is only here to help morphdom morph accurately

    const { content, author, timestamp } = thread.value

    var img = h('Thumbnail')
    var m = /\!\[[^]+\]\(([^\)]+)\)/.exec(marksum.image(content.text))
    if(m) {
      //Hey this works! fit an image into a specific size (see thread-card.mcss)
      //centered, and scaled to fit the square (works with both landscape and portrait!)
      //This is functional css not opinionated css, so all embedded.
      img.style = 'background-image: url("'+api.blob.sync.url(m[1])+'"); background-position:center; background-size: cover;'
    }

    const title = render(marksum.title(content.text))
    const summary = render(marksum.summary(content.text))

    const className = thread.unread ? '-unread': ''

    return h('BlogCard', { id, className }, [
      h('div.context', [
        api.about.html.avatar(author),
        h('div.name', api.about.obs.name(author)),
        h('div.timeago', humanTime(new Date(timestamp))),
      ]),
      h('div.content', {'ev-click': onClick}, [
        img,
        h('div.text', [
          h('h2', {innerHTML: title}),
          content.channel
            ? h('Button -channel', '#'+content.channel)
            : '',
          h('div.summary', {innerHTML: summary})
        ])
      ])
    ])
  })
}



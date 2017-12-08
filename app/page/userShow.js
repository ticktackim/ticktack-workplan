const nest = require('depnest')
const { h, Array: MutantArray, computed, when, map } = require('mutant')
const pull = require('pull-stream')
const get = require('lodash/get')
const path = require('path')

exports.gives = nest('app.page.userShow')

exports.needs = nest({
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'about.obs.description': 'first',
  'app.html.context': 'first',
  'app.html.link': 'first',
  'app.html.blogCard': 'first',
  'app.html.blogNav': 'first',
  'app.html.scroller': 'first',
  'contact.html.follow': 'first',
  'feed.pull.profile': 'first',
  'feed.pull.rollup': 'first',
  'message.html.markdown': 'first',
  'keys.sync.id': 'first',
  'sbot.pull.userFeed': 'first',
  'translations.sync.strings': 'first',
  'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  var isUnread = api.unread.sync.isUnread
  return nest('app.page.userShow', userShow)

  function userShow (location) {
    const { feed } = location
    const myId = api.keys.sync.id()

    const strings = api.translations.sync.strings()

    const Link = api.app.html.link
    const userEditButton = Link(
      { page: 'userEdit', feed }, 
      // h('i.fa.fa-pencil')
      h('img', { src: path.join(__dirname, '../../assets', 'edit.png') })
    )
    const directMessageButton = Link({ page: 'threadNew', feed }, h('Button', strings.userShow.action.directMessage))

    const BLOG_TYPES = ['blog', 'post']

    // TODO return some of this ?
    // but maybe this shouldn't be done here ?
    // pull.through(function (blog) { 
    //   if(isUnread(blog))
    //     blog.unread = true
    //   blog.replies.forEach(function (data) {  // this was fed rollups
    //     if(isUnread(data))
    //       blog.unread = data.unread = true
    //   })
    // }),

    const prepend = [
      api.app.html.blogNav(location),
      h('section.about', [
        api.about.html.avatar(feed, 'large'),
        h('h1', [
          api.about.obs.name(feed),
          feed === myId // Only expose own profile editing right now
            ? userEditButton
            : ''
        ]),
        h('div.introduction', computed(api.about.obs.description(feed), d => api.message.html.markdown(d || ''))),
        feed !== myId
          ? h('div.actions', [
              api.contact.html.follow(feed),
              h('div.directMessage', directMessageButton)
            ])
          : '',
      ]),
    ]

    const store = MutantArray()
    // store(console.log)

    return h('Page -userShow', [
      api.app.html.context(location),
      api.app.html.scroller({
        classList: ['content'],
        prepend, 
        // stream: api.feed.pull.profile(feed),
        stream: opts => api.sbot.pull.userFeed(Object.assign({}, { id: feed }, opts)),
        indexProperty: ['value', 'sequence'],
        filter: () => pull(
          // pull.filter(msg => get(msg, 'value.author') === feed),
          pull.filter(msg => typeof msg.value.content !== 'string'),
          pull.filter(msg => get(msg, 'value.content.root') === undefined),
          pull.filter(msg => BLOG_TYPES.includes(get(msg, 'value.content.type')))
        ),
        render: blog => {
          return api.app.html.blogCard(blog)
        },
        store
      })
    ])
  }
}


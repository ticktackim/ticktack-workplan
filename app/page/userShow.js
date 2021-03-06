const nest = require('depnest')
const { h, Array: MutantArray, computed } = require('mutant')
const pull = require('pull-stream')
const get = require('lodash/get')
const path = require('path')

exports.gives = nest('app.page.userShow')

exports.needs = nest({
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'about.obs.description': 'first',
  'app.html.link': 'first',
  'app.html.blogCard': 'first',
  'app.html.topNav': 'first',
  'app.html.scroller': 'first',
  'app.html.sideNav': 'first',
  'blog.sync.isBlog': 'first',
  'contact.html.follow': 'first',
  'contact.html.block': 'first',
  'feed.pull.user': 'first',
  'keys.sync.id': 'first',
  'message.html.markdown': 'first',
  'translations.sync.strings': 'first',
  // 'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  // var isUnread = api.unread.sync.isUnread
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
    const directMessageButton = Link({ page: 'threadNew', participants: [feed] }, h('Button', strings.userShow.action.directMessage))

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
      api.app.html.topNav(location),
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
            h('div.directMessage', directMessageButton),
            api.contact.html.follow(feed),
            api.contact.html.block(feed)
          ])
          : ''
      ])
    ]

    const store = MutantArray()

    // indexProperty: ['value', 'sequence'],

    return h('Page -userShow', [
      api.app.html.sideNav(location),
      api.app.html.scroller({
        classList: ['content'],
        prepend,
        createStream: api.feed.pull.user(feed),
        filter: () => pull(
          // pull.filter(msg => get(msg, 'value.author') === feed),
          pull.filter(msg => typeof msg.value.content !== 'string'),
          pull.filter(msg => get(msg, 'value.content.root') === undefined),
          pull.filter(api.blog.sync.isBlog)
        ),
        render: blog => {
          return api.app.html.blogCard(blog)
        },
        store
      })
    ])
  }
}

const nest = require('depnest')
const { h, Array: MutantArray, computed, when, map } = require('mutant')
const pull = require('pull-stream')
const get = require('lodash/get')

exports.gives = nest('app.page.userShow')

exports.needs = nest({
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'app.html.link': 'first',
  'app.html.blogCard': 'first',
  'contact.html.follow': 'first',
  'feed.pull.rollup': 'first',
  'sbot.pull.userFeed': 'first',
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first',
  'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  var isUnread = api.unread.sync.isUnread
  return nest('app.page.userShow', userShow)

  function userShow (location) {

    const { feed } = location
    const myId = api.keys.sync.id()
    const name = api.about.obs.name(feed)

    const strings = api.translations.sync.strings()

    // const { followers } = api.contact.obs

    // const youFollowThem = computed(followers(feed), followers => followers.includes(myId))
    // const theyFollowYou = computed(followers(myId), followers => followers.includes(feed))
    // const youAreFriends = computed([youFollowThem, theyFollowYou], (a, b) => a && b)

    // const ourRelationship = computed(
    //   [youAreFriends, youFollowThem, theyFollowYou],
    //   (youAreFriends,  youFollowThem, theyFollowYou) => {
    //     if (youAreFriends) return strings.userShow.state.friends
    //     if (theyFollowYou) return strings.userShow.state.theyFollow
    //     if (youFollowThem) return strings.userShow.state.youFollow
    //   }
    // )

    const Link = api.app.html.link
    const userEditButton = Link({ page: 'userEdit', feed }, h('i.fa.fa-pencil'))
    const directMessageButton = Link({ page: 'threadNew', feed }, h('Button', strings.userShow.action.directMessage))

    const BLOG_TYPES = ['blog', 'post']
    const blogs = MutantArray()
    pull(
      api.sbot.pull.userFeed({id: feed, reverse: true, live: false}),
      pull.filter(msg => msg.value && msg.value.content && !msg.value.content.root),
      pull.filter(msg => BLOG_TYPES.includes(get(msg, 'value.content.type'))),
      // pull.filter(msg => get(msg, 'value.content.root') === undefined),
      api.feed.pull.rollup(),
      //unread state should not be in this file...
      pull.through(function (blog) {
        if(isUnread(blog))
          blog.unread = true
        blog.replies.forEach(function (data) {
          if(isUnread(data))
            blog.unread = data.unread = true
        })
      }),
      pull.drain(blogs.push)
      // TODO - new Scroller ?
    )

    return h('Page -userShow', {title: name}, [
      h('div.content', [
        h('section.about', [
          api.about.html.avatar(feed, 'large'),
          h('h1', [
            name,
            feed === myId // Only expose own profile editing right now
              ? userEditButton
              : ''
          ]),
          feed !== myId
            ? h('div.actions', [
                api.contact.html.follow(feed),
                h('div.directMessage', directMessageButton)
              ])
            : '',
        ]),
        h('section.blogs', map(blogs, api.app.html.blogCard))
      ])
    ])
  }
}


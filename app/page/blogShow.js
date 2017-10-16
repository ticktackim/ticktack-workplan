const nest = require('depnest')
const { h, Array: MutantArray, computed, when, map } = require('mutant')
const pull = require('pull-stream')
const get = require('lodash/get')

exports.gives = nest('app.page.userShow')

exports.needs = nest({
  'about.html.image': 'first',
  'about.obs.name': 'first',
  'app.html.link': 'first',
  'app.html.blogCard': 'first',
  'contact.async.follow': 'first',
  'contact.async.unfollow': 'first',
  'contact.obs.followers': 'first',
  'feed.pull.private': 'first',
  'feed.pull.rollup': 'first',
  'keys.sync.id': 'first',
  'state.obs.threads': 'first',
  'translations.sync.strings': 'first',
})

exports.create = (api) => {
  return nest('app.page.userShow', userShow)

  function userShow (location) {

    const { feed } = location
    const myId = api.keys.sync.id()
    const name = api.about.obs.name(feed)

    const strings = api.translations.sync.strings()

    const { followers } = api.contact.obs

    const youFollowThem = computed(followers(feed), followers => followers.includes(myId))
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
    const { unfollow, follow } = api.contact.async
    const followButton = when(followers(myId).sync,
      when(youFollowThem,
        h('Button -primary', { 'ev-click': () => unfollow(feed) }, strings.userShow.action.unfollow),
        h('Button -primary', { 'ev-click': () => follow(feed) }, strings.userShow.action.follow)
      ),
      h('Button', { disabled: 'disabled' }, strings.loading )
    )

    const Link = api.app.html.link
    const userEditButton = Link({ page: 'userEdit', feed }, h('i.fa.fa-pencil'))
    const directMessageButton = Link({ page: 'threadNew', feed }, h('Button', strings.userShow.action.directMessage))

    const threads = MutantArray()
    pull(
      // next(api.feed.pull.private, {reverse: true, limit: 100, live: false}, ['value', 'timestamp']),
      // api.feed.pull.private({reverse: true, limit: 100, live: false}),
      api.feed.pull.private({reverse: true, live: false}),
      pull.filter(msg => {
        const recps = get(msg, 'value.content.recps')
        if (!recps) return

        return recps
          .map(r => typeof r === 'object' ? r.link : r)
          .includes(feed)
      }),
      api.feed.pull.rollup(),
      pull.drain(threads.push)
      // Scroller(content, scrollerContent, render, false, false)
    )

    return h('Page -userShow', {title: name}, [
      h('div.content', [
        h('section.about', [
          api.about.html.image(feed),
          h('h1', [
            name,
            feed === myId // Only expose own profile editing right now
              ? userEditButton
              : ''
          ]),
          feed !== myId
            ? h('div.actions', [
                h('div.friendship', followButton),
                h('div.directMessage', directMessageButton)
              ])
            : '',
        ]),
        h('section.blogs', map(threads, api.app.html.blogCard))
      ])
    ])
  }
}



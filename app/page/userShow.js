const nest = require('depnest')
const { h, Array: MutantArray, computed, when, map } = require('mutant')
const pull = require('pull-stream')
const get = require('lodash/get')

exports.gives = nest('app.page.userShow')

exports.needs = nest({
  'app.html.link': 'first',
  'app.html.nav': 'first',
  'app.html.threadCard': 'first',
  'about.html.image': 'first',
  'about.obs.name': 'first',
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

    const strings = api.translations.sync.strings()

    const { followers } = api.contact.obs

    const youFollowThem = computed(followers(feed), followers => followers.has(myId))
    const theyFollowYou = computed(followers(myId), followers => followers.has(feed))
    const youAreFriends = computed([youFollowThem, theyFollowYou], (a, b) => a && b)

    const ourRelationship = computed(
      [youAreFriends, youFollowThem, theyFollowYou],
      (youAreFriends,  youFollowThem, theyFollowYou) => {
        if (youAreFriends) return strings.userShow.state.friends
        if (theyFollowYou) return strings.userShow.state.theyFollow
        if (youFollowThem) return strings.userShow.state.youFollow
      }
    )
    const { unfollow, follow } = api.contact.async
    const followButton = when(followers(myId).sync,
      when(youFollowThem,
        h('Button -subtle', { 'ev-click': () => unfollow(feed) }, strings.userShow.action.unfollow),
        h('Button -primary', { 'ev-click': () => follow(feed) }, strings.userShow.action.follow)
      ),
      h('Button', { disabled: 'disabled' }, strings.loading )
    )


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
      // Scroller(container, content, render, false, false)
    )

    const Link = api.app.html.link

    return h('Page -userShow', [
      api.app.html.nav(),
      h('h1', api.about.obs.name(feed)),
      h('div.container', [
        api.about.html.image(feed),
        feed !== myId
          ? h('div.friendship', [
            h('div.state', ourRelationship),
            followButton
          ]) : '',
        h('div', '...friends in common'),
        h('div', '...groups this person is in'),
        feed !== myId
          ? Link({ page: 'threadNew', feed }, h('Button -primary', strings.userShow.action.directMessage))
          : '',
        h('div.threads', map(threads, api.app.html.threadCard))
      ])
    ])
  }
}

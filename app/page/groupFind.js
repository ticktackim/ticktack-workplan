const nest = require('depnest')
const { h, Value, computed, map } = require('mutant')

exports.gives = nest('app.page.groupFind')

exports.needs = nest({
  'app.html.link': 'first',
  'channel.async.suggest': 'first',
  'translations.sync.strings': 'first',
})

exports.create = (api) => {
  return nest('app.page.groupFind', groupFind)

  function groupFind (location) {
    const strings = api.translations.sync.strings()
    const input = Value('')

    // CHANNEL != GROUP
    // note we're using channels in initial approximation of groups 
    const suggester = api.channel.async.suggest()
    const groups = computed(input, input => suggester(input)) 

    const Link = api.app.html.link

    return h('Page -groupFind', {title: strings.groupFind.pageTitle}, [
      h('div.container', [
        h('div.search', [
          h('i.fa.fa-search'),
          h('input', { 
            placeholder: strings.groupFind.action.findAGroup,
            autofocus: 'autofocus',
            'ev-input': e => input.set(e.target.value) 
          }),
        ]),
        h('div.results', map(groups, group => {
          return Link({ channel: group.title },
            h('div.result', [
              // api.about.html.image(user.id),
              h('div.alias', group.id), // channel with #
              h('pre.key', group.subtitle || ' '), // subscribed or not
            ])
          )
        })),
        computed([input, groups], (input, groups) => {
          if (input.length && groups.length === 0) {
            return h('div.groupNotFound', [
              h('div.info', strings.groupFind.state.groupNotFound),
              Link(
                { page: 'threadNew', channel: input, flash: strings.groupFind.flash.createFirstThread },
                h('Button -primary', strings.groupFind.action.newGroup)
              )
            ])
          }
        })
      ])
    ])
  }
}






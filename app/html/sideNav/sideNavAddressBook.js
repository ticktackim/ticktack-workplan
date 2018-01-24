const nest = require('depnest')
const { h, computed, Struct, map, when, Dict, Array: MutantArray, Value, Set, resolve } = require('mutant')
const pull = require('pull-stream')
const next = require('pull-next-step')
const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')
const path = require('path')

exports.gives = nest({
  'app.html.sideNav': true,
})

exports.needs = nest({
  // 'app.html.scroller': 'first',
  // 'about.html.avatar': 'first',
  // 'about.obs.name': 'first',
  // 'feed.pull.private': 'first',
  // 'history.sync.push': 'first',
  // 'message.html.subject': 'first',
  // 'sbot.obs.localPeers': 'first',
  'translations.sync.strings': 'first',
  // 'unread.sync.isUnread': 'first'
})

exports.create = (api) => {
  return nest({
    'app.html.sideNav': sideNav,
  })

  function sideNav (location, relationships) {
    if (location.page !== 'addressBook') return

    const strings = api.translations.sync.strings().addressBook

    // TODO - show local peers?
    // var nearby = api.sbot.obs.localPeers()

    return h('SideNav -addressBook', [
      LevelOneSideNav(),
    ])

    function LevelOneSideNav () {
      function count (relationshipType) {
        return computed(relationships, rels => rels[relationshipType].length)
      }

      return h('div.level.-one', [
        h('section', [
          h('Option', [
            h('Button -primary', {}, strings.action.addUser),
          ]),
          h('hr'),
        ]),
        
        //Friends
        h('section', [
          h('header',strings.heading.people),
          h('Option', [
            h('i.fa.fa-angle-right'),
            strings.section.friends,
            h('div.count', count('friends'))
          ]),
          h('Option',[
            h('i.fa.fa-angle-right'),
            strings.section.following,
            h('div.count', count('following'))
          ]),
          h('Option',[
            h('i.fa.fa-angle-right'),
            strings.section.followers,
            h('div.count', count('followers'))
          ]),
        ])
      ])
    }
  }
}


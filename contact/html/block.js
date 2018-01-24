const nest = require('depnest')
const { h, Array: MutantArray, computed, when, map, Value } = require('mutant')

exports.gives = nest('contact.html.block')

exports.needs = nest({
  'contact.async.block': 'first',
  'contact.async.unblock': 'first',
  'contact.obs.blockers': 'first',
  'keys.sync.id': 'first',
  'translations.sync.strings': 'first',
  'app.html.lightbox': 'first'
})

exports.create = (api) => {

  return nest('contact.html.block', block)

  function block (feed) {
    const strings = api.translations.sync.strings()
    const myId = api.keys.sync.id()

    if (feed === myId) return

    const { blockers } = api.contact.obs
    const theirBlockers = blockers(feed)
    const youBlockThem = computed(theirBlockers, blockers => blockers.includes(myId))
    const { unblock, block } = api.contact.async
    const className = when(youBlockThem, '-blocking')

    const confirmationDialog = h("div.dialog", [
      h("div.message","block means you will never receive message from this user"), 
      h("div.actions", [
        h('Button', 'Cancel'),
        h('Button -primary',{'ev-click': () => block(feed)}, 'Block')
      ])
    ])

    const isOpen = Value(false)
    const lb = api.app.html.lightbox(confirmationDialog, isOpen)

    return h('Block', { className }, [
      when(theirBlockers.sync,
        when(youBlockThem,
          h('Button', { 'ev-click': () => unblock(feed) }, strings.userShow.action.unblock),
          h('Button', { 'ev-click': () => isOpen.set(true) }, strings.userShow.action.block)
        ),
        h('Button', { disabled: 'disabled' }, strings.loading )
      ),
      lb
    ])
  }
}


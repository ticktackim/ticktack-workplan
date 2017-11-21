const nest = require('depnest')
const { h } = require('mutant')
const pull = require('pull-stream')
const Scroller = require('mutant-scroll')
const next = require('pull-next-step')

exports.gives = nest('app.html.scroller')

exports.needs = nest({
  'message.html.render': 'first'
})

exports.create = function (api) {
  return nest('app.html.scroller', createScroller)

  function createScroller (opts = {}) {
    const { 
      stream,
      filter = () => pull.filter((msg) => true),

    } = opts

    const streamToTop = pull(
      next(stream, {old: false, limit: 100}, ['value', 'timestamp']),
      filter() // is a pull-stream through
    )

    const streamToBottom = pull(
      next(stream, {reverse: true, limit: 100, live: false}, ['value', 'timestamp']),
      filter()
    )

    return Scroller(Object.assign({}, opts, { streamToTop, streamToBottom }))
    // valid Scroller opts :  see github.com/mixmix/mutant-scroll
    //   classList = [],
    //   prepend = [],
    //   append = [],
    //   streamToTop,
    //   streamToBottom,
    //   render,
    //   updateTop =  updateTopDefault,
    //   updateBottom = updateBottomDefault,
    //   store = MutantArray(),
    //   cb = (err) => { if (err) throw err }
  }
}

function keyscroll (content) {
  var curMsgEl

  if (!content) return () => {}

  content.addEventListener('click', onActivateChild, false)
  content.addEventListener('focus', onActivateChild, true)

  function onActivateChild (ev) {
    for (var el = ev.target; el; el = el.parentNode) {
      if (el.parentNode === content) {
        curMsgEl = el
        return
      }
    }
  }

  function selectChild (el) {
    if (!el) { return }

    ;(el.scrollIntoViewIfNeeded || el.scrollIntoView).call(el)
    el.focus()
    curMsgEl = el
  }

  return function scroll (d) {
    selectChild((!curMsgEl || d === 'first') ? content.firstChild
      : d < 0 ? curMsgEl.previousElementSibling || content.firstChild
      : d > 0 ? curMsgEl.nextElementSibling || content.lastChild
      : curMsgEl)

    return curMsgEl
  }
}

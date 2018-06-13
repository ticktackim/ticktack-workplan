const nest = require('depnest')
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
      stream, // TODO - rename this to createStream (rename across app)
      filter = () => pull.filter((msg) => true),
      indexProperty = ['timestamp']
    } = opts

    const streamToTop = pull(
      next(stream, { live: true, reverse: false, old: false, limit: 100, property: indexProperty }),
      filter() // is a pull-stream through
    )

    const streamToBottom = pull(
      next(stream, { live: false, reverse: true, limit: 100, property: indexProperty }),
      filter()
    )

    const _opts = Object.assign(
      { overflowY: 'auto' }, // TODO check across app what makes better default
      opts,
      { streamToTop, streamToBottom }
    )

    return Scroller(_opts)
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
    //   overflowY = 'scroll'
  }
}

const nest = require('depnest')
const pull = require('pull-stream')
const Scroller = require('mutant-scroll')

exports.gives = nest('app.html.scroller')

exports.needs = nest({
  'message.html.render': 'first'
})

exports.create = function (api) {
  return nest('app.html.scroller', createScroller)

  function createScroller (opts = {}) {
    const {
      createStream,
      filter = () => pull.filter((msg) => true)
    } = opts

    const streamToTop = pull(
      createStream({ live: true, reverse: false, old: false, limit: 100 }),
      filter() // is a pull-stream through
    )

    const streamToBottom = pull(
      createStream({ live: false, reverse: true, limit: 100 }),
      filter()
    )

    const _opts = Object.assign(
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

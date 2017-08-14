
exports.gives = {translations: {sync: {strings: true}}}

exports.create = function () {
  return {translations: {sync: {strings: function () {
    return {
      showMore: "Show More",
      channels: "Channels",
      directMessages: "Direct Messages",
      replySymbol: "> "
    }
  }}}}
}

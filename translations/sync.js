
exports.gives = {translations: {sync: {strings: true}}}

exports.create = function () {
  return {translations: {sync: {strings: function () {
    return {
      showMore: "Show More",
      channels: "Channels",
      home: "Home",
      directMessages: "Direct Messages",
      replySymbol: "> ",
      error: "Error",
      errorNotFound: "The page wasn't found",
      groupNew: "New Group",
      groupFind: 'Find Group',
      groupIndex: "Group Index",
      //stub: should not be shown on released software!
      stub: "this page is a stub",
      settings: "Settings",
      threadNew: 'New Thread',
      threadShow: "Direct Messages",
      userFind: "Find User",
      userIsInGroups: "is in groups:"
      userConversationsWith: 'conversations you\'ve had with',
      follow: "Follow",
      friendsInCommon: 'friends in common'
    }
  }}}}
}



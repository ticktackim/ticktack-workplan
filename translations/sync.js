const nest = require('depnest')

exports.gives = nest('translations.sync.strings')

exports.create = (api) => {
  return nest('translations.sync.strings', () => en)
}

const en = {
  loading: 'Loading...',
  optionalField: 'optional',
  sendMessage: 'Send',
  showMore: 'Show More',
  channel: {
    action: {
      newThread: 'New thread'
    }
  },
  directMessages: 'Direct Messages',
  replySymbol: '> ',
  home: "Home",
  error: "Error",
  errorNotFound: "The page wasn't found",
  groupNew: "New Group",
  groupFind: 'Find Group',
  groupIndex: "Group Index",
  //stub: should not be shown on released software!
  stub: "this page is a stub",
  settings: "Settings",
  threadNew: {
    pageTitle: 'New Thread',
    field: {
      to: 'To',
      subject: 'Subject',
      channel: 'Channel'
    }

  },
  threadShow: "Direct Messages",
  userShow: {
    action: {
      follow: 'Follow',
      unfollow: 'Unfollow',
      directMessage: 'New Direct Message'
    },
    state: {
      friends: 'You are friends',
      youFollow: 'You follow them',
      theyFollow: 'They follow you',
      userFind: "Find User",
      userIsInGroups: "is in groups:",
      userConversationsWith: 'conversations you\'ve had with',
      follow: "Follow",
      friendsInCommon: 'friends in common'
    }
  }
}















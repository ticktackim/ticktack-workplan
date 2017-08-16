const nest = require('depnest')

exports.gives = nest('translations.sync.strings')

exports.create = (api) => {
  return nest('translations.sync.strings', () => en)
}

const en = {
  loading: 'Loading...',
  showMore: 'Show More',
  channels: 'Channels',
  directMessages: 'Direct Messages',
  replySymbol: '> ',
  userShow: {
    action: {
      follow: 'Follow',
      unfollow: 'Unfollow',
      directMessage: 'New Direct Message'
    },
    state: {
      friends: 'You are friends',
      youFollow: 'You follow them',
      theyFollow: 'They follow you'
    }
  }
}


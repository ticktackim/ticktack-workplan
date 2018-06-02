module.exports = {
  stats: 'Stats',
  comments: 'Comments',
  likes: 'Likes',
  shares: 'Shares',
  themes: {
    light: 'Light',
    dark: 'Dark'
  },
  splash: {
    about: [
      'A social network that values openness, equality, and freedom.',
      'A new social network for people seeking an equitable world that values the value people create and successfully balances freedom, solidarity, privacy, and openness.',
      "Let's do it right this time. A Web 3.0 social network, connecting the next billion with a decentralized platform built for openness, freedom, and equality.",
      'An open, equal and free social network.'
    ],
    slogan: 'Ticktack: blogging for the decentralized era'
  },
  pluginsOk: {
    heading: 'Ticktack running in limited mode',
    description: 'Another scuttlebutt app is managing your shared database. Core functionality will work, but you may find there are some features that do not work.',
    advice: 'If you are running Patchwork, close Patchwork before running Ticktack to get the full set of features',
    action: {
      ok: 'Okay'
    }
  },
  blogIndex: {
    title: 'Discover'
  },
  topNav: {
    blogsAll: 'Dynamics',
    blogSearch: 'Search'
  },
  blogNew: {
    field: {
      title: 'Title',
      summary: 'Summary'
    },
    actions: {
      edit: 'Edit',
      preview: 'Preview',
      writeBlog: 'Write your blog here'
    }
  },
  channel: 'Channel',
  loading: 'Loading...',
  optionalField: 'optional',
  writeMessage: 'Write a message',
  writeComment: 'Write a comment',
  peopleNearby: 'People nearby',
  sendMessage: 'Send',
  publishBlog: 'Publish',
  showMore: 'Show More',
  directMessages: 'Direct Messages',
  home: 'Home',
  error: 'Error',
  errorNotFound: "The page wasn't found",
  groupNew: 'New Group',
  groupFind: {
    action: {
      findAGroup: 'Find Group',
      newGroup: 'Create this group'
    },
    state: {
      groupNotFound: 'This group does not exist yet.'
    },
    flash: {
      createFirstThread: 'Start this group by posting the first thread.'
    }
  },
  groupIndex: 'Group Index',
  settingsPage: {
    title: 'Settings',
    action: {
      edit: 'Edit'
    },
    section: {
      name: 'Name',
      introduction: 'Introduction',
      language: 'Language',
      zoom: 'Zoom',
      version: 'Version',
      theme: 'Theme (beta)'
    }
  },
  addressBook: {
    action: {
      addUser: 'Add a user',
      find: {
        friends: 'Search your friends',
        following: "Search people you're following",
        followers: 'Search your followers',
        search: 'Search for a user'
      }
    },
    heading: {
      people: 'People'
    },
    section: {
      friends: 'Friends',
      following: 'Following',
      followers: 'Followers'
    }
  },
  threadNew: {
    pageTitle: 'New Thread',
    field: {
      to: 'To',
      subject: 'Subject'
    },
    action: {
      new: 'New Message',
      addMoreRecps: 'add more recipients (optional)'
    }
  },
  threadShow: 'Direct Messages',
  userEdit: {
    section: {
      avatar: 'Avatar',
      name: 'Name',
      introduction: 'Introduction'
    },
    instruction: {
      crop: 'Click and drag to crop your avatar'
    },
    action: {
      okay: 'Okay',
      cancel: 'Cancel',
      save: 'Save'
    }
  },
  userFind: {
    action: {
      findAUser: 'Find a user'
    }
  },
  userShow: {
    action: {
      follow: 'Follow',
      unfollow: 'Unfollow',
      directMessage: 'New Direct Message',
      block: 'Block',
      unblock: 'Unblock',
      blockConfirmationMessage: 'block means you will never receive message from this user',
      cancel: 'Cancel'
    },
    state: {
      friends: 'You are friends',
      youFollow: 'You follow them',
      theyFollow: 'They follow you',
      userIsInGroups: 'is in groups:',
      userConversationsWith: 'conversations you\'ve had with',
      follow: 'Follow',
      friendsInCommon: 'friends in common'
    }
  },
  channelShow: {
    action: {
      subscribe: 'Subscribe',
      unsubscribe: 'Unsubscribe'
    }
  },
  subscriptions: {
    user: 'My subscriptions',
    friends: 'Friends subscriptions',
    state: {
      noSubscriptions: 'You have no subscriptions yet'
    }
  },
  share: {
    captionPlaceholder: 'Type an optional caption here',
    shareLabel: 'Share this blog with your followers',
    externalShareLabel: 'Share this blog with on the Web',
    action: {
      share: 'Share',
      copy: 'Copy external URL',
      open: 'Open external URL'
    },
    settings: {
      caption: 'Web Sharing Metrics',
      publicOption: 'publish metrics openly',
      authorAndYouOption: 'publish for you and author',
      justYouOption: 'publish just for you'
    }
  },
  statsShow: {
    title: 'Stats',
    prevMonth: 'Prev 30 days',
    nextMonth: 'Next 30 days',
    thirtyDays: '30 days'
  },
  backup: {
    sectionName: 'Backup',
    ftu: {
      importAction: 'Import identity',
      createAction: 'Create new identity',
      busyMessage: 'Processing...',
      welcomeHeader: 'Welcome to Ticktack',
      welcomeMessage: 'Do you want to create a new identity or import one?'
    },
    export: {
      header: 'Export identity',
      message: [
        'Please backup your private key file very carefully.',
        'If your private key is hacked, all your private messages will be retrieved by third party, and your identity will be faked on the network'
      ],
      passwordPlaceholder: 'Please enter password to protect export file',
      cancelAction: 'Cancel',
      exportAction: 'Export Identity',
      dialog: {
        label: 'Export Identity',
        title: 'Export Identity'
      }
    },
    import: {
      importAction: 'Import Identity',
      header: 'Importing identity',
      myFeedProgress: 'Progress (your identity)',
      myFriendsProgress: 'Progress (your friends)',
      dialog: {
        label: 'Import Identity',
        title: 'Import Identity'
      },
      details: 'Reconstructing your identity will take some time. Ticktack will launch once your identity is synchronized, but it will take some time to gather your friends data, so some messages and blogs will arrive later. You can safely close this window and Ticktack will resume sync next time you open it.'
    }
  },
  languages: {
    en: 'English',
    zh: '中文'
  }
}

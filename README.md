# Ticktack

A decentralized social platform enable people to share knowledge and exchange value, with p2p messaging encrypted feature. 



## Development

### Repos

- ` ssb://%wnNDjViKYZH+RWpbNzDXR2oxLWmTagvvFBjy97Zko4I=.sha256`

### Install

```bash
$ npm install
$ npm run rebuild
```

### App env

To run a **embedded sbot** setup (recomended - this is how the installer will run):

1. run `npm start`
2. to debug sbot from terminal, run `$ sbot whoami` or `$ sbot progress`

**Note** you'll need a `~/.ssb/config` file to be able to do (2).
It should have the plugins you're using and a copy of the content of `default-config.json`, so will look something like (this example may be out of date, as we're no longer running a private network):

```json
{
  "plugins": {
    "ssb-about": true,
    "ssb-backlinks": true
  },
  "port": 43750,
  "blobsPort": 43751,
  "ws": { "port": 43751 },
  "caps": {"shs": "ErgQF85hFQpUXp69IXtLW+nXDgFIOKKDOWFX/st2aWk="},
  "autoinvite": "128.199.132.182:43750:@7xMrWP8708+LDvaJrRMRQJEixWYp4Oipa9ohqY7+NyQ=.ed25519~YC4ZnjHH8qzsyHe2sihW8WDlhxSUH33IthOi4EsldwQ="
}
```

There are a couple of ENV vars made available to make development easier:
```
$ STARTUP_DELAY=0 STARTUP_PAGE=addressBook npm start
```
`STARTUP_DELAY` - defaults to `2000`ms, setting it to 0 skips the splash screen pause
`STARTUP_PAGE` - defaults to `blogIndex`, setting this to another page makes refreshing the app to a particular named page easy.


To run **standalone sbot** setup with standard ssb key + network :

1. start you sbot `$ sbot server`
2. run `$ npm run start-electro` in the repo directory

Remember that you will need the right sbot plugins installed on your global sbot.


### Translations

Theses are in `/translations`.
There's a helper script in there called `checker.js` which looks for translations in `en` (english) that are missing from `zh` (mandarin).


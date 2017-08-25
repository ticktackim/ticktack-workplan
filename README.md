# Ticktack

## Planning

Workplan 1 

Trello 

## Development

### Repos

- `git@github.com:ticktackim/ticktack-wp1.git`
- `ssb://%tkJPTTaxOzfLbsewZmgC9CslSER0ntjQOcyhIk6y/cQ=.sha256`

### Install

```bash
$ npm install
$ npm run rebuild
```

### App env

To run **development** setup with standard ssb key + network :

1. start you sbot `$ sbot server`
2. run `$ npm run dev` in the repo directory

To run a **production** setup: 

1. run `npm start`
2. to debug sbot from terminal, run `$ ssb_appname=ticktack sbot whoami`

**Note** you'll need a `~/.ticktack/config` file to be able to do (2).
It should have the plugins you're using and a copy of the content of default-config.json, so will look something like: 

```json
{
  "plugins": {
    "ssb-contacts": true,
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


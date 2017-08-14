# Ticktack

## Planning

Workplan 1 : https://hackmd.io/BwZhCYHZwNgFgLRxAU0XAhjECCcBGSDBGSfOSEDAE2oDMBWXIA==?view#

Trello : https://trello.com/b/93eXDvVP/ticktack


## Development

### Repos

- `git@github.com:ticktackim/ticktack-wp1.git`
- `ssb://%tkJPTTaxOzfLbsewZmgC9CslSER0ntjQOcyhIk6y/cQ=.sha256`

### Install

```bash
$ npm install
$ npm run setup
$ npm start
```

### App env

This app starts with default `ssb_appname` of `ticktack-ssb`, so you can find it's data in `~/.ticktack-ssb`.

To load the app with your classic ssb key, run :

```bash
$ ssb_appname=ssb npm start
```


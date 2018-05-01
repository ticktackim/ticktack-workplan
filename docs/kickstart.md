---
title: "Ticktack :: kickstart
---

# Ticktack Kickstart

The application begins with [index.js](https://github.com/ticktackim/ticktack-workplan/blob/master/index.js) which launches _electron_ to host the application UI and a background process to start the p2p replication with _sbot_.

The UI/UX loads from [main.js](https://github.com/ticktackim/ticktack-workplan/blob/master/main.js) which uses _depject_ to load all the required modules and builds the ui by calling `app()` from [`app.html.app`](https://github.com/ticktackim/ticktack-workplan/blob/master/app/html/app.js).

The p2p replication loads from [background-process.js](https://github.com/ticktackim/ticktack-workplan/blob/master/background-process.js). This file starts _sbot_ and all the needed _sbot plugins_.

Those are the three main entrypoints of the application: electron, ui and background process.

Depending on which part you want to contribute, you might want to check one or the other.

Most of the _depject_ modules of the app are used by the UI part which is loaded from `main.js`. Unless you want to make changes to electron itself or down at the _"back-end"_ of ticktack, thats where your routines will start from.


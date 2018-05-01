---
title: "Ticktack :: Stack"
---

# Ticktack stack
As with other popular scuttlebutt clients, ticktack relies on the proven combination of:

* [NodeJS](https://nodejs.org): a fast JS engine based on v8 which is used to run the _sbot_ background process.
* [Electron](https://electronjs.org/): a framework for creating native applications with web technologies based on WebKit.
* [depject](https://www.npmjs.com/package/depject): a very clever dependency injection system that allows modules to publish their exposed features and require features from other modules without hardcoding of names and paths.
* [patchcore](https://www.npmjs.com/package/patchcore): a _depject_ based collection of modules for working with SecureScuttlebutt applications, in their own words _"shared assumptions of all (or most) ssb related applications"_.
* [mutant](https://github.com/mmckegg/mutant): Framework used to create the UI of Ticktack. 
* [pull-streams](https://pull-stream.github.io/): A minimal pipeable stream system. Used heavily in most ssb apps together with mutant to provide reactive observables to build the UI.

Now that you know what is the stack, why not check [how the application works](kickstart.md). 
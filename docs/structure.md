---
title: "Ticktack :: Folder structure"
---

# Folder structure
Ticktack follows a similar folder structure like other popular scuttlebutt clients such as patchwork and patchbay. 

It uses the folder structure as namespaces to separate different modules into their own files so that when you see some code that _needs_ a module named `channel.obs.subscribed`, you will find the code at 📁`channel/obs/subscribed.js` where the first folder is the namespace of the module.

It is a common pattern for module namespaces to have the following subfolders:

* `html`: for HTML elements that are used to make the views in the app.
* `obs`: for [mutant observables](https://github.com/mmckegg/mutant).
* `sync`: for holding synchronous methods.
* `async`: for holding asynchronous methods.

There are a couple modules which are often worked on on larger contributions.

* `router`: Inside that folder (aka the router namespace), there are all the _routes_ used in the application. If you want to add _a new page_ to ticktack, you will need to add a reference to it there.
* `app`: This is a very large namespace, it basically contains most of the app. Regarding this one, the `html` folder inside it contains reusable _html elements_ and a special `page` folder contains each _page used in the app_. So to add a new page, you will need to work on both `router/sync/index.js` and somewhere inside `app/page`.
* `translations`: Ticktack contains translations for both English and Chinese. This folder contains a folder for each language supported by the app. Instead of using hardcoded strings in your contribution, you're encouraged to add your strings to the necessary language file in there. You can then access them by using the `translations.sync.strings` module.
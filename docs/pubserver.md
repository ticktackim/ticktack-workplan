# Pub Servers

Ticktack has two pub servers (share1.ticktack.im and share2.ticktack.im) in two different regions of the world to help with latency issues for users in NEMEA regions. Both servers run the same operating system, which is Ubuntu x64.


## Docker setup
We use docker to run the pub server software inside a container and followed the instructions from [ssb-pub](https://github.com/ahdinosaur/ssb-pub) to install the software but we had to modify it a bit as the scripts assume a Debian install instead of an Ubuntu install. The only place where this becomes an issue is the installation of docker itself for it has different repositories for Ubuntu and Debian. Because of that each step of the installation script was executed by hand replacing the needed bits to work on Ubuntu.

## Pub sever setup
No change was made to the pub server code itself but during setup, except for installing some plugins by hand, by logging into the container and installing them into `~/.ssb/node_modules` (`git-ssb` and `ssb-viewer`). We might want to patch the installation scripts to have an optional flag to install those plugins.

## SSB Viewer setup
Ticktack is a blogging app and uses a special kind of message for exchanging blog content. At the time of the setup, the code to support `blog` messages were in the `calm` branch of `ssb-viewer` and thats what I used but it also required some manual patching to make it work inside docker:

* The viewer would try to bind to the machine IP but since it was running inside docker, it can't do it. I patched it to listen on `0.0.0.0` with a hardcoded option. 
* The `init()` function of the plugin didn't call the `serveHttp()` function, so _requiring_ the plugin was not enough to start the viewer. So I've changed the `init()` function to call the serving function.

### Warning
None of those changes made up to upstream project. Actually after talking to the maintainer of that code, I've learned that the `calm` branch is deprecated and that the `master` branch now contains the correct code (which is also more robust). If we're doing any work on the pub severs, we should consider migrating to the master branch. As far as I could see on their code, we might be able to write a little configuration entry to specify the IP to listen, which would allow us to work with that branch without the need to patch it.

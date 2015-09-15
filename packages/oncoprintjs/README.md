oncoprint.js
============

Home of the OncoPrint visualization as used on the [cBioPortal](www.cbioportal.org).

## Latest Build

Download the latest build here (TODO).

## Setup

1. Install `nodejs`. `npm` is bundled together with `nodejs`. `nodejs` is almost certainly provided by your favorite package manager or you can find it [here][nodejs]. Here is a [blog post][install-npm] from people at nodejs with a bit more detail.
2. Install gulp globally:
```sh
    npm install --global gulp
```
This is not exactly a perfect solution to getting the gulp binary into your `PATH` but it seems to be a standard followed by many. Not to fear, gulp knows how to resolve version mismatch between global and local (i.e. what is specified in `package.json`) versions.

3. Run `npm install` to install the dependencies as described in `package.json`.

## Build

TODO

[nodejs]:https://nodejs.org/
[http-server]:https://github.com/indexzero/http-server
[install-npm]:http://blog.npmjs.org/post/85484771375/how-to-install-npm

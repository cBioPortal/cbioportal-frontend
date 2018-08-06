[![Build Status](https://travis-ci.org/cBioPortal/oncoprintjs.svg?branch=master)](https://travis-ci.org/cBioPortal/oncoprintjs)
# OncoprintJS
This is the library that generates the Oncoprint visualization in cBioPortal. Essentially, it populates a canvas of a grid of `m` tracks of `n` types, where each element can either be a discrete value represented by a colored glyph on a grey background or a continuous value within a color range. Oncoprint can have many conceivable uses, but in cBioPortal, it is primarily used to visualize tracks of `m` genes and `n` patient samples, where the colored glyphs represent genomic alterations. It is also used to display a heatmap of gene and/or protein expression values for those `m` genes and `n` patient samples.

## Using the Node Module
Oncoprint is on [NPM](https://www.npmjs.com/package/oncoprintjs). To install:

    npm install --save oncoprintjs

In order to use it, just `require` it into your script.

    const Oncoprint = require('oncoprintjs');
    
It can also be imported

    import Oncoprint from "oncoprintjs";

A full documentation of the API is still pending, but the typescript declarations in `index.d.ts` may be of use.

## Development
### Getting Started
First, clone the repo:

	git clone https://github.com/cBioPortal/oncoprintjs.git

Install the necessary NPM packages defined in `package.json` by running:

	npm install
	
Next, build

	webpack
	
Which will write `dist/oncoprint.bundle.js`, which is a CommonJS module and can be included using `require`.	

The directory `rules/` contains glyph styling specifications that are specific to the genomic alterations use case of Oncoprint, which you may want to use.

### Changes to Oncoprint
If you make changes to the Oncoprint code base and want to load it into the examples, do not modify `oncoprint.bundle.js`, since all of your code will get overwritten when compiled using `webpack`. Instead, modify the files in `src/` and then re-run `webpack`.

### Minimum Working Example
The `test/` folder holds the code that runs the examples. All examples are mounted in `index.html`, which contains one JS file per example. 

WARNING: THESE MAY NOT BE UP TO DATE AND MAY NOT WORK. 

The file `server.js` starts the basic node server, serving files from `dist/`, `rules/`, and `test/` on port 3000. To see the examples, execute the following:

	node server.js

**Note:** These examples are very oversimplified versions of what is used in production versions of cBioPortal and are only meant to test code paths and give a sense of how the API connects together..



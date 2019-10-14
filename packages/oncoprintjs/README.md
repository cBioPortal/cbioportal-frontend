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

A full documentation of the API is still pending, but the typescript declarations in `dist/js/oncoprint.d.ts` may be of use.

## Development
### Getting Started
First, clone the repo:

	git clone https://github.com/cBioPortal/oncoprintjs.git

Install the necessary NPM packages defined in `package.json` by running:

	npm install
	
Next, build

	npm run build
	
Which will write `dist/oncoprint.bundle.js`, which is a CommonJS module and can be included using `require`, or `import`.	

The directory `rules/` contains glyph styling specifications that are specific to the genomic alterations use case of Oncoprint, which you may want to use.

### Changes to Oncoprint
If you make changes to the Oncoprint code base and want to load it into the examples, do not modify `oncoprint.bundle.js`, since all of your code will get overwritten when compiled using `npm run build`. Instead, modify the files in `src/` and then re-run `npm run build`.

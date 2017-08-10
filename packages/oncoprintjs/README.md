[![Build Status](https://travis-ci.org/cBioPortal/oncoprintjs.svg?branch=master)](https://travis-ci.org/cBioPortal/oncoprintjs)
# OncoprintJS
This is the library that generates the Oncoprint visualization in cBioPortal. Essentially, it populates a canvas of a grid of `m` tracks of `n` types, where each element can either be a discrete value represented by a colored glyph on a grey background or a continuous value within a color range. Oncoprint can have many conceivable uses, but in cBioPortal, it is primarily used to visualize tracks of `m` genes and `n` patient samples, where the colored glyphs represent genomic alterations. It is also used to display a heatmap of gene and/or protein expression values for those `m` genes and `n` patient samples.

## Getting Started
First, clone the repo:

	git clone https://github.com/cBioPortal/oncoprintjs.git

Install the necessary NPM packages defined in `package.json`, create the output folder, `gulp` the files:

	cd oncoprintjs
	npm install
	mkdir -p dist
	gulp

Oncoprint currently has some hard-coded image files, so to set it up for the examples, run:

	mkdir -p dist/img
	mv dist/*.svg dist/img

You should now have a folder `dist/` with the oncoprint files in it, including `oncoprint-bundle.js`. This is the original library file. The directory `rules/` contains glyph styling specifications that are specific to the genomic alterations use case of Oncoprint, so it is separate for the library file. 

## Changes to Oncoprint
If you make changes to the Oncoprint code base and want to load it into the examples, do not modify `oncoprint-bundle.js`, since all of your code will get overwritten when gulped. Instead, modify the files in `src/` and then re-run `gulp`.

## Minimum Working Example
The `test/` folder holds the code that runs the examples. All examples are mounted in `index.html`, which contains one JS file per example. The file `server.js` starts the basic node server, serving files from `dist/`, `rules/`, and `test/` on port 3000. To see the examples, execute the following:

	node server.js

**Note:** These examples are very oversimplified versions of what is used in production versions of cBioPortal and are only meant to test code paths and give a sense of how the API connects together.


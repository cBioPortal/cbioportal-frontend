"use strict";
/* eslint-disable */

let webpack = require('webpack');


let config = {
    entry: {
        // create two library bundles, one with jQuery and
        // another with Angular and related libraries
        common: ['jquery', 'react', 'react-dom', 'react-redux', 'react-bootstrap', 'seamless-immutable', 'lodash']
    },

    output: {
        filename: '[name].bundle.js',
        path: 'common-dist',

        // The name of the global variable which the library's
        // require() function will be assigned to
        library: '[name]_lib',
    },

    plugins: [

    ],
};

config.plugins = [

    new webpack.DllPlugin({
        // The path to the manifest file which maps between
        // modules included in a bundle and the internal IDs
        // within that bundle
        path: 'common-dist/[name]-manifest.json',
        // The name of the global variable which the library's
        // require function has been assigned to. This must match the
        // output.library option above
        name: '[name]_lib'
    }),
    new webpack.DefinePlugin({
        'process.env':{
            'NODE_ENV': `"${process.env.NODE_ENV || 'production'}"`
        }
    }),
    new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false
        },
        sourceMap:false,
        comments:false
    }),

];


module.exports = config;

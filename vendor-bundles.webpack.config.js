"use strict";
/* eslint-disable */

let webpack = require('webpack');
const path = require('path');


let config = {
    entry: {
        // create two library bundles, one with jQuery and
        // another with Angular and related libraries
        common: ['jquery','imports-loader?jquery=jquery!jquery-migrate', 'react', 'react-dom', 'react-bootstrap', 'seamless-immutable', 'lodash',
            'mobx', 'mobx-react', 'chart.js', 'victory', 'react-select', 'react-rangeslider', 'mobx-utils', 'd3', 'datatables.net', 'webpack-raphael']
    },

    module: {
        loaders: [
            { test: /lodash/, loader: 'imports-loader?define=>false'}
        ]
    },

    output: {
        filename: '[name].bundle.js',
        path:  path.resolve(__dirname, 'common-dist'),

        // The name of the global variable which the library's
        // require() function will be assigned to
        library: '[name]_lib',
    },

    devtool : 'source-map',

    plugins: [

    ],

    devtool : 'source-map'
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
    })

];

if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== "test") {

    config.plugins.push(

        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            sourceMap:true,
            comments:false
        })

    )

}



module.exports = config;

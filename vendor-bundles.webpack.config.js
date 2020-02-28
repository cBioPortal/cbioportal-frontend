const webpack = require('webpack');
const path = require('path');

// we don't need sourcemaps on circleci
const sourceMap = process.env.DISABLE_SOURCEMAP ? '' : 'source-map';

const config = {
    entry: {
        // create two library bundles, one with jQuery and
        // another with Angular and related libraries
        common: [
            'jquery',
            'imports-loader?jquery=jquery!jquery-migrate',
            'react',
            'react-dom',
            'react-bootstrap',
            'seamless-immutable',
            'lodash',
            'mobx',
            'mobx-react',
            'chart.js',
            'victory',
            'react-select',
            'react-rangeslider',
            'mobx-utils',
            'd3',
            'datatables.net',
            'webpack-raphael',
            'pluralize',
            'react-if',
            'react-select1',
        ],
    },

    module: {
        rules: [{ test: /lodash/, loader: 'imports-loader?define=>false' }],
    },

    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'common-dist'),

        // The name of the global variable which the library's
        // require() function will be assigned to
        library: '[name]_lib',
    },

    devtool: sourceMap,

    plugins: [],
};

config.resolve = {
    modules: [path.join('src', 'common'), 'node_modules'],
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
        name: '[name]_lib',
    }),
];

module.exports = config;

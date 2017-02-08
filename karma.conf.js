/* eslint-disable */

var argv = require('yargs').argv;

process.env.NODE_ENV = 'test';

var webpackConfig = require('./webpack.config');

var path = require('path');

// code which should not impact coverage reports should be listed
// in exclude
webpackConfig.module.postLoaders =  [
    {
        test: /.tsx?$/,
        include: path.resolve(__dirname, 'src/'),
        exclude: [
            /.spec./,
            /\/shared\/api\//
        ],
        loader: 'istanbul-instrumenter-loader'
    }
];

webpackConfig.entry = [];

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['mocha', 'chai'],
        files: [
            {
                pattern: './common-dist/common.bundle.js',
                watched: false,
                served: true
            },
            'tests.webpack.js',
        ],

        preprocessors: {
            // add webpack as preprocessor
            'tests.webpack.js': ['webpack', 'sourcemap'],
        },

        pattern:".spec.",

        webpack: webpackConfig,
        webpackServer: {
            noInfo: true
        },

        plugins: [
            'karma-mocha',
            'karma-chai',
            'karma-webpack',
            'karma-phantomjs-launcher',
            'karma-spec-reporter',
            'karma-sourcemap-loader',
            'karma-coverage',
            'karma-coverage-istanbul-reporter'
        ],

        coverageIstanbulReporter: {
            reports: ['text-summary','json-summary','html', 'lcov'],
            dir: './test/fixtures/outputs'
        },

        reporters: ['spec','coverage-istanbul'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['PhantomJS'],
        singleRun: !argv.watch,
    });
};

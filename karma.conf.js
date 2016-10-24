/* eslint-disable */

var argv = require('yargs').argv;

process.env.NODE_ENV = 'test';

var webpackConfig = require('./webpack.config');

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
            'karma-coverage'
        ],

        reporters: ['coverage', 'spec'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['PhantomJS'],
        singleRun: !argv.watch,
        coverageReporter: {
            reporters: [
                {type: 'lcov'},
                {type: 'text-summary'}
            ],
        }
    });
};

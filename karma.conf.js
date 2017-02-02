/* eslint-disable */

var argv = require('yargs').argv;

process.env.NODE_ENV = 'test';

var webpackConfig = require('./webpack.config');

module.exports = function (config) {
    var preprocessors = ['webpack', 'sourcemap'];
    var plugins = [
        'karma-mocha',
        'karma-chai',
        'karma-webpack',
        'karma-phantomjs-launcher',
        'karma-spec-reporter',
        'karma-sourcemap-loader',
    ];
    // change preprocessors and plugins if coverage report is requested
    if (config.reporters.indexOf('coverage') > -1) {
        preprocessors.push('coverage');
        plugins.push('karma-coverage');
    }

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
            'tests.webpack.js': preprocessors,

        },

        webpack: webpackConfig,
        webpackServer: {
            noInfo: true
        },
        plugins: plugins,
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

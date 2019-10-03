/* eslint-disable */

var argv = require('yargs').argv;

process.env.NODE_ENV = 'test';

var webpackConfig = require('./webpack.config');

const webpack = require('webpack');

var path = require('path');

// code which should not impact coverage reports should be listed
// in exclude
// webpackConfig.module.rules.push({
//         test: /.tsx?$/,
//         include: path.resolve(__dirname, 'src/'),
//         exclude: [
//             /.spec./,
//             /\/shared\/api\//
//         ],
//         enforce:'post',
//         loader: 'istanbul-instrumenter-loader'
// });

//this will be used by in test context to load corresponding spec files if there is a grep passed (or all if not)
webpackConfig.plugins.push(new webpack.DefinePlugin({
    'SPEC_REGEXP': ('grep' in argv) ? `/(global|(${argv.grep}[a-z]*))\.spec\./i` : '/\.spec\.(jsx?|tsx?)$/'
}));

webpackConfig.entry = "";

webpackConfig.mode = "development";

if (argv.debug) {
    console.log("argv: ",argv);
    webpackConfig.devtool = "inline-source-map";
}

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
            { pattern: "src/**/*.json",
                included: false,
                watched:false,
                served:true
            },
            'tests.webpack.js'
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
        webpackMiddleware: {
            // webpack-dev-middleware configuration
            // i. e.
            stats: 'errors-only'
        },

        plugins: [
            'karma-mocha',
            'karma-mocha-reporter',
            'karma-chai',
            'karma-webpack',
            //'karma-phantomjs-launcher',
            'karma-chrome-launcher',
            'karma-sourcemap-loader',
            //'karma-coverage',
            'karma-junit-reporter'
        ],

        customLaunchers: {
            Chrome_with_debugging: {
                base: 'Chrome',
                chromeDataDir: path.resolve(__dirname, '.chrome'),
                flags: [ '--remote-debugging-port=9333' ]
            }
        },

        // coverageIstanbulReporter: {
        //     reports: ['text-summary','json-summary','html', 'lcov'],
        //     dir: './test/fixtures/outputs'
        // },

        junitReporter: {
            outputDir: process.env.JUNIT_REPORT_PATH,
            outputFile: process.env.JUNIT_REPORT_NAME,
            useBrowserName: false
        },

        mochaReporter: {
            showDiff: true
        },

        reporters: ['mocha','junit'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_DISABLE,
        browsers: ['Chrome'],
        //browsers: ['PhantomJS'],
        singleRun: !argv.watch,
    });
};

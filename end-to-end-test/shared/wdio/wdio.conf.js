const { join } = require('path');

const mergeReports = require('./merge-e2e-reports');

const fs = require('fs');
var path = require('path');
var VisualRegressionCompare = require('wdio-novus-visual-regression-service/compare');
var getScreenshotName = require('./getScreenshotName');

const TEST_TYPE = process.env.TEST_TYPE || 'remote';

const { transformJUNITFiles } = require('../edit-junit');

const debug = process.env.DEBUG;
const defaultTimeoutInterval = 180000;

const resultsDir = process.env.JUNIT_REPORT_PATH || './shared/results/';

const retries = process.env.RETRIES || 2;

let screenshotRoot = process.env.SCREENSHOT_DIRECTORY;

// correct if screenshot directory has trailing slash
screenshotRoot = screenshotRoot.replace(/\/$/, '');

const chromeArgs = [
    '--disable-composited-antialiasing',
    '--allow-insecure-localhost',
].concat(
    (function() {
        return process.env.HEADLESS_CHROME === 'true'
            ? [
                  '--headless',
                  '--no-sandbox',
                  '--disable-setuid-sandbox',
                  '--in-process-gpu',
                  '--use-gl=angle',
              ]
            : [];
    })()
);

var diffDir = path.join(process.cwd(), `${screenshotRoot}/diff/`);
var refDir = path.join(process.cwd(), `${screenshotRoot}/reference/`);
var screenDir = path.join(process.cwd(), `${screenshotRoot}/screen/`);
var errorDir =
    (process.env.JUNIT_REPORT_PATH || './shared/results/') + 'errors/';

console.log(`TEST TYPE: ${TEST_TYPE}`);

console.log(`ENV SCREENSHOT_DIRECTORY: ${process.env.SCREENSHOT_DIRECTORY}`);
console.log(`ENV JUNIT_REPORT_PATH PATH: ${process.env.JUNIT_REPORT_PATH}`);
console.log(`ENV JUNIT_REPORT_PATH PATH: ${process.env.JUNIT_REPORT_PATH}`);

console.log(`screenshot root: ${screenshotRoot}`);
console.log(`diff dir: ${diffDir}`);
console.log(`ref dir: ${refDir}`);
console.log(`screen dir: ${screenDir}`);

var defaultMaxInstances = TEST_TYPE === 'remote' ? 3 : 1;

const LocalCompare = new VisualRegressionCompare.LocalCompare({
    referenceName: getScreenshotName(refDir),
    screenshotName: getScreenshotName(screenDir),
    diffName: getScreenshotName(diffDir),
    misMatchTolerance: 0.01,
});

function proxyComparisonMethod(target) {
    const oldProcessScreenshot = target.processScreenshot;
    LocalCompare.processScreenshot = async function(context, base64Screenshot) {
        const screenshotPath = this.getScreenshotFile(context);
        const referencePath = this.getReferencefile(context);
        const referenceExists = await fs.existsSync(referencePath);

        // add it to test data in case it's needed later
        context.test.referenceExists = referenceExists;

        const resp = await oldProcessScreenshot.apply(this, arguments);

        // process screenshot will create a reference screenshot
        // if it's missing.  this will cause subsequent retries to fail
        // for this reason, we just delete the reference image
        // so that the test will fail with missing reference error
        if (referenceExists === false) {
            console.log(`MISSING REFERENCE SCREENSHOT: ${referencePath}`);
            console.log('REMOVING auto generated reference image');
            fs.rmSync(referencePath);
            const report = {
                ...this.createResultReport(1000, false, true),
                referenceExists,
            };
            return report;
        }

        return resp;
    };
}

function saveErrorImage(
    test,
    context,
    { error, result, duration, passed, retries },
    networkLog
) {
    if (error) {
        if (!fs.existsSync(errorDir)) {
            fs.mkdirSync(errorDir, 0744);
        }
        const title = test.title.trim().replace(/\s/g, '_');
        const img = `${errorDir}/${title}.png`;
        console.log('ERROR SHOT PATH' + img);
        browser.saveScreenshot(img);

        networkLog[title.trim()] = browser.execute(function() {
            Object.keys(window.ajaxRequests).forEach(key => {
                window.ajaxRequests[key].end = Date.now();
                window.ajaxRequests[key].duration =
                    window.ajaxRequests[key].end -
                    window.ajaxRequests[key].started;
            });

            return JSON.stringify(window.ajaxRequests);
        });
    }
}

proxyComparisonMethod(LocalCompare);

const grep = process.argv.find(l => /--grep=/.test(l));

let SPEC_FILE_PATTERN = undefined;

// if we cound a grep, assign it to spec file pattern
if (grep) {
    SPEC_FILE_PATTERN = grep.split('=')[1];
} else {
    SPEC_FILE_PATTERN = process.env.SPEC_FILE_PATTERN
        ? process.env.SPEC_FILE_PATTERN
        : `${TEST_TYPE}/specs/**/*.spec.js`;
}

// if spec pattern contains slash, use it whole, otherwise, assume it is just a spec file name or wildcard
SPEC_FILE_PATTERN = SPEC_FILE_PATTERN.includes('/')
    ? SPEC_FILE_PATTERN
    : `${TEST_TYPE}/specs/**/${SPEC_FILE_PATTERN}`;

exports.config = {
    //
    // ====================
    // Runner Configuration
    // ====================
    //
    // WebdriverIO allows it to run your tests in arbitrary locations (e.g. locally or
    // on a remote machine).
    runner: 'local',
    //
    // ==================
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the directory
    // from which `wdio` was called. Notice that, if you are calling `wdio` from an
    // NPM script (see https://docs.npmjs.com/cli/run-script) then the current working
    // directory is where your package.json resides, so `wdio` will be called from there.
    //
    //

    specs: [SPEC_FILE_PATTERN],

    exclude: ['./local/specs/web-tour.spec.js'],

    // Patterns to exclude.
    //exclude: ['./local/specs/web-tour.spec.js'],
    //
    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
    // time. Depending on the number of capabilities, WebdriverIO launches several test
    // sessions. Within your capabilities you can overwrite the spec and exclude options in
    // order to group specific specs to a specific capability.
    //
    // First, you can define how many instances should be started at the same time. Let's
    // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
    // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
    // files and you set maxInstances to 10, all spec files will get tested at the same time
    // and 30 processes will get spawned. The property handles how many capabilities
    // from the same test should run tests.
    //
    maxInstances: debug ? 1 : defaultMaxInstances,
    //
    // If you have trouble getting all important capabilities together, check out the
    // Sauce Labs platform configurator - a great tool to configure your capabilities:
    // https://docs.saucelabs.com/reference/platforms-configurator
    //
    capabilities: [
        {
            // maxInstances can get overwritten per capability. So if you have an in-house Selenium
            // grid with only 5 firefox instances available you can make sure that not more than
            // 5 instances get started at a time.
            maxInstances: 5,
            //
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: chromeArgs,
            },
            acceptInsecureCerts: true,
            //acceptSslCerts: true,
            // If outputDir is provided WebdriverIO can capture driver session logs
            // it is possible to configure which logTypes to include/exclude.
            // excludeDriverLogs: ['*'], // pass '*' to exclude all driver session logs
            // excludeDriverLogs: ['bugreport', 'server'],
        },
    ],

    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    logLevel: 'error',
    //
    // Set specific log levels per logger
    // loggers:
    // - webdriver, webdriverio
    // - @wdio/applitools-service, @wdio/browserstack-service, @wdio/devtools-service, @wdio/sauce-service
    // - @wdio/mocha-framework, @wdio/jasmine-framework
    // - @wdio/local-runner
    // - @wdio/sumologic-reporter
    // - @wdio/cli, @wdio/config, @wdio/sync, @wdio/utils
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    // logLevels: {
    //     webdriver: 'info',
    //     '@wdio/applitools-service': 'info'
    // },
    //
    // If you only want to run your tests until a specific amount of tests have failed use
    // bail (default is 0 - don't bail, run all tests).
    bail: 0,
    //
    // Set a base URL in order to shorten url command calls. If your `url` parameter starts
    // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
    // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
    // gets prepended directly.
    baseUrl: 'http://localhost',
    //
    // Default timeout for all waitFor* commands.
    waitforTimeout: 10000,
    //
    // Default timeout in milliseconds for request
    // if browser driver or grid doesn't send response
    connectionRetryTimeout: 120000,
    //
    // Default request retries count
    connectionRetryCount: 3,

    //
    // Test runner services
    // Services take over a specific job you don't want to take care of. They enhance
    // your test setup with almost no effort. Unlike plugins, they don't add new
    // commands. Instead, they hook themselves up into the test process.
    services: [
        [
            'novus-visual-regression',
            {
                compare: LocalCompare,
                viewportChangePause: 300,
                viewports: [{ width: 1600, height: 1000 }],
                orientations: ['landscape', 'portrait'],
            },
        ],
    ],

    //port: 9515,
    // FROM OLD webdriver config
    // capabilities: [
    //     {
    //         //browserName: 'chrome',
    //         chromeOptions: {
    //             args: [
    //                 '--disable-composited-antialiasing',
    //                 '--allow-insecure-localhost',
    //             ],
    //         },
    //
    //         os: 'OS X',
    //         os_version: 'High Sierra',
    //         browser: 'Chrome',
    //         browser_version: '74.0 beta',
    //         resolution: '1600x1200',
    //     },
    // ],
    //
    // IECapabilties: [
    //     {
    //         os: 'Windows',
    //         os_version: '10',
    //         browser: 'IE',
    //         browser_version: '11.0',
    //         'browserstack.selenium_version': '3.5.2',
    //         resolution: '1600x1200',
    //         'browserstack.local': true,
    //     },
    // ],

    // Framework you want to run your specs with.
    // The following are supported: Mocha, Jasmine, and Cucumber
    // see also: https://webdriver.io/docs/frameworks.html
    //
    // Make sure you have the wdio adapter package for the specific framework installed
    // before running any tests.
    framework: 'mocha',
    //
    // The number of times to retry the entire specfile when it fails as a whole
    specFileRetries: 0,
    //
    // Delay in seconds between the spec file retry attempts
    // specFileRetriesDelay: 0,
    //
    // Whether or not retried specfiles should be retried immediately or deferred to the end of the queue
    specFileRetriesDeferred: false,
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // see also: https://webdriver.io/docs/dot-reporter.html
    reporters: [
        'spec',
        [
            'json',
            {
                outputDir: process.env.JUNIT_REPORT_PATH || './shared/results/',
                outputFileFormat: function(opts) {
                    return `results-${opts.cid}.json`;
                },
            },
        ],
        [
            'junit',
            {
                outputDir: process.env.JUNIT_REPORT_PATH || './shared/results/',
                outputFileFormat: function(opts) {
                    return `results-${opts.cid}.${opts.capabilities.browserName}.xml`;
                },
            },
        ],
    ],

    testHome: process.env.JUNIT_REPORT_PATH,

    //
    // Options to be passed to Mocha.
    // See the full list at http://mochajs.org/
    mochaOpts: {
        ui: 'bdd',
        timeout: debug ? 20000000 : defaultTimeoutInterval, // make big when using browser.debug()
        require: './shared/wdio/it-override.js',
        retries: retries,
    },
    //
    // =====
    // Hooks
    // =====
    // WebdriverIO provides several hooks you can use to interfere with the test process in order to enhance
    // it and to build services around it. You can either apply a single function or an array of
    // methods to it. If one of them returns with a promise, WebdriverIO will wait until that promise got
    // resolved to continue.
    /**
     * Gets executed once before all workers get launched.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     */
    // onPrepare: function (config, capabilities) {
    // },
    /**
     * Gets executed before a worker process is spawned and can be used to initialise specific service
     * for that worker as well as modify runtime environments in an async fashion.
     * @param  {String} cid      capability id (e.g 0-0)
     * @param  {[type]} caps     object containing capabilities for session that will be spawn in the worker
     * @param  {[type]} specs    specs to be run in the worker process
     * @param  {[type]} args     object that will be merged with the main configuration once worker is initialised
     * @param  {[type]} execArgv list of string arguments passed to the worker process
     */
    // onWorkerStart: function (cid, caps, specs, args, execArgv) {
    // },
    /**
     * Gets executed just before initialising the webdriver session and test framework. It allows you
     * to manipulate configurations depending on the capability or spec.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that are to be run
     */
    // beforeSession: function (config, capabilities, specs) {
    // },
    /**
     * Gets executed before test execution begins. At this point you can access to all global
     * variables like `browser`. It is the perfect place to define custom commands.
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs        List of spec file paths that are to be run
     * @param {Object}         browser      instance of created browser/device session
     */
    before: function(capabilities, specs) {},
    /**
     * Runs before a WebdriverIO command gets executed.
     * @param {String} commandName hook command name
     * @param {Array} args arguments that command would receive
     */
    // beforeCommand: function (commandName, args) {
    // },
    /**
     * Hook that gets executed before the suite starts
     * @param {Object} suite suite details
     */
    // beforeSuite: function (suite) {
    // },
    /**
     * Function to be executed before a test (in Mocha/Jasmine) starts.
     */
    // beforeTest: function (test, context) {
    // },
    /**
     * Hook that gets executed _before_ a hook within the suite starts (e.g. runs before calling
     * beforeEach in Mocha)
     */
    // beforeHook: function (test, context) {
    // },
    networkLog: {},
    /**
     * Hook that gets executed _after_ a hook within the suite starts (e.g. runs after calling
     * afterEach in Mocha)
     */
    afterHook: function(
        test,
        context,
        { error, result, duration, passed, retries }
    ) {
        saveErrorImage(
            test,
            context,
            { error, result, duration, passed, retries },
            this.networkLog
        );
    },
    /**
     * Function to be executed after a test (in Mocha/Jasmine).
     */
    afterTest: function(
        test,
        context,
        { error, result, duration, passed, retries }
    ) {
        saveErrorImage(
            test,
            context,
            { error, result, duration, passed, retries },
            this.networkLog
        );
    },
    /**
     * Hook that gets executed after the suite has ended
     * @param {Object} suite suite details
     */
    // afterSuite: function (suite) {
    // },
    /**
     * Runs after a WebdriverIO command gets executed
     * @param {String} commandName hook command name
     * @param {Array} args arguments that command would receive
     * @param {Number} result 0 - command success, 1 - command error
     * @param {Object} error error object if any
     */
    // afterCommand: function (commandName, args, result, error) {
    // },
    /**
     * Gets executed after all tests are done. You still have access to all global variables from
     * the test.
     * @param {Number} result 0 - test pass, 1 - test fail
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that ran
     */
    // after: function (result, capabilities, specs) {
    // },
    /**
     * Gets executed right after terminating the webdriver session.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that ran
     */
    // afterSession: function (config, capabilities, specs) {
    //
    // },
    /**
     * Gets executed after all workers got shut down and the process is about to exit. An error
     * thrown in the onComplete hook will result in the test run failing.
     * @param {Object} exitCode 0 - success, 1 - fail
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {<Object>} results object containing test results
     */
    onComplete: function(exitCode, config, capabilities, results) {
        mergeReports(resultsDir, `${resultsDir}/completeResults.json`);
        //
        // //this is going to eliminate duplicate tests caused by retries
        // //leaving, for each unique test name only one result (error or pass)
        // transformJUNITFiles(resultsDir);
    },
    /**
     * Gets executed when a refresh happens.
     * @param {String} oldSessionId session ID of the old session
     * @param {String} newSessionId session ID of the new session
     */
    //onReload: function(oldSessionId, newSessionId) {
    //}
};

let WDIOReporter = require('@wdio/reporter').default;
let events = require('events');
const fs = require('fs');
const _ = require('lodash');

const ipc = require('node-ipc');

class CustomReporter extends WDIOReporter {
    // constructor() {
    //     //super();
    //
    //
    //     this.report = {
    //         meta: {},
    //
    //         tests: [],
    //     };
    // }

    constructor(...args) {
        super(args);

        ipc.config.id = 'runnerProcess';
        ipc.config.retry = 1500;
        ipc.config.silent = true;
        ipc.serve(() => {
            ipc.server.on('test_it', message => {
                this.addTest({
                    type: 'test',
                    prelim: true,
                    title: message,
                });
            });
            ipc.server.on('test_skipped', message => {
                this.addTest({
                    type: 'test',
                    prelim: false,
                    title: message,
                    status: 'skipped',
                    locked: true,
                });
            });
        });
        ipc.server.start();
    }

    addTest(test) {
        const existingTest = this.testsByUid[test.uid];
        const locked = existingTest && existingTest.locked === true;
        if (!locked) {
            this.testsByUid[test.uid] = test;
        }
    }

    testsByUid = {};

    onRunnerStart() {}
    onBeforeCommand() {}
    onAfterCommand() {}
    onSuiteStart(stats) {}
    onHookStart() {}
    onHookEnd() {}
    onTestStart() {}
    onTestPass(test) {}
    onTestFail(test) {}
    onTestSkip(test) {
        //this.report.tests.push(test);
    }
    onTestEnd(test) {
        this.testsByUid[test.uid] = test;
    }
    onSuiteEnd() {}
    onRunnerEnd() {
        //console.log(this.runnerStat);

        let tests = Object.keys(this.testsByUid).map(k => {
            const test = this.testsByUid[k];
            const { output, ...simplified } = test;

            const title = test.title.trim().replace(/\s/g, '_');

            simplified.network = this.runnerStat.config.networkLog[title];

            simplified.file = this.runnerStat.specs[0];

            return simplified;
        });

        const outputPath = `${this.options[0].outputDir}/customReport.json`;
        if (fs.existsSync(outputPath)) {
            // combine existing tests with new tests
            const existingTests = JSON.parse(
                fs.readFileSync(outputPath).toString()
            ).tests;
            tests = [...existingTests, ...tests];
        }

        const strReport = JSON.stringify(
            {
                testHome: this.options[0].testHome,
                tests,
            },
            null,
            5
        );

        fs.writeFileSync(
            `${this.options[0].outputDir}/customReportJSONP.js`,
            `jsonpCallback(${strReport});`,
            err => {
                if (err) console.log(err);
                console.log('Successfully Written to File.');
            }
        );

        fs.writeFileSync(outputPath, strReport, err => {
            if (err) console.log(err);
            console.log('Successfully Written to File.');
        });
    }
}

module.exports = CustomReporter;

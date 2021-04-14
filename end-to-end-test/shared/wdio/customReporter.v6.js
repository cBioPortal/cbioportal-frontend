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
        const existingTest = this.report.tests.find(
            t => test.title === t.title
        );
        const locked = existingTest && existingTest.locked === true;
        if (!locked) {
            // attempt to remove it (could be undefined)
            this.report.tests = _.remove(this.report.tests, existingTest);
            this.report.tests.push(test);
        }
    }

    report = {
        meta: {},

        tests: [],
    };

    onRunnerStart() {}
    onBeforeCommand() {}
    onAfterCommand() {}
    onSuiteStart(stats) {}
    onHookStart() {}
    onHookEnd() {}
    onTestStart() {}
    onTestPass(test) {}
    onTestFail() {}
    onTestSkip(test) {
        //this.report.tests.push(test);
    }
    onTestEnd(test) {
        const filtered = this.report.tests.filter(t => {
            return t.title !== test.title;
        });
        filtered.push(test);
        this.report.tests = filtered;
    }
    onSuiteEnd() {}
    onRunnerEnd() {
        this.report.testHome = this.options[0].testHome;

        const strReport = JSON.stringify(this.report, null, 5);

        fs.writeFileSync(
            `${this.options[0].outputDir}/customReportJSONP.js`,
            `jsonpCallback(${strReport});`,
            err => {
                if (err) console.log(err);
                console.log('Successfully Written to File.');
            }
        );

        fs.writeFileSync(
            `${this.options[0].outputDir}/customReport.json`,
            strReport,
            err => {
                if (err) console.log(err);
                console.log('Successfully Written to File.');
            }
        );
    }
}

module.exports = CustomReporter;

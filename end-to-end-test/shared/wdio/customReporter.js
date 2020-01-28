let events = require('events');
const fs = require('fs');

class WdioTestRailReporter extends events.EventEmitter {
    /**
     * @param {{}} baseReporter
     * @param {{testRailsOptions}} config wdio config
     */
    constructor(baseReporter, config) {
        super();

        this.report = {
            meta: {},

            tests: [],
        };

        this.on('custom-report', data => {
            this.report.tests.push(data.data);
        });

        this.on('test:pending', data => {
            this.report.tests.push({ test: data });
        });

        this.on('end', () => {
            const strReport = JSON.stringify(this.report);

            fs.writeFileSync(
                `${config.reporterOptions.custom.outputDir}/customReportJSONP.js`,
                `jsonpCallback(${strReport});`,
                err => {
                    if (err) console.log(err);
                    console.log('Successfully Written to File.');
                }
            );

            fs.writeFileSync(
                `${config.reporterOptions.custom.outputDir}/customReport.json`,
                strReport,
                err => {
                    if (err) console.log(err);
                    console.log('Successfully Written to File.');
                }
            );
        });
    }
}

// webdriver requires class to have reporterName option
WdioTestRailReporter.reporterName = 'WebDriver.io test rail reporter';

module.exports = WdioTestRailReporter;

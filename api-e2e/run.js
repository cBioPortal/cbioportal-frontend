var json = require('./json/merged-tests.json');
var najax = require('najax');
//import json from './json/merged-tests.json';
var { validate, reportValidationResult } = require('./validation');
const test = json[1].suites[0].tests[0];

const host = 'http://localhost:8082';

async function main() {
    const result = await validate(
        najax,
        `${host}${test.url}`,
        test.data,
        test.label,
        test.hash
    );

    console.log(reportValidationResult(result, ''));
}

main();

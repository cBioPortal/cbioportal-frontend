var json = require('./json/merged-tests.json');
var najax = require('najax');
var { validate, reportValidationResult, runSpecs } = require('./validation');
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

    const fileFilter = 'mutation-data';

    const files = fileFilter?.trim().length
        ? json.filter(f => new RegExp(fileFilter).test(f.file))
        : json;

    await runSpecs(files, najax, 'http://localhost:8082');

    //console.log(reportValidationResult(result, ''));
}

main();

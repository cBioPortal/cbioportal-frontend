const csv = require('csvtojson');
const csvFilePath = './extract-2024-10-11T00_29_53.795Z.csv';
const _ = require('lodash');
const formatCurl = require('format-curl');

var axios = require('axios');
var { runSpecs } = require('./validation');

const exclusions = [
    /clinical-data-density/,
    /molecular-profile-sample/,
    /clinical-event-type/,
];
const filters = []; //[/clinical-event-type/];

const START = 0;
const LIMIT = 10000;

async function main() {
    const files = await csv()
        .fromFile(csvFilePath)
        .then(async jsonObj => {
            const uniq = _.uniqBy(jsonObj, '@hash')
                .filter(d => {
                    return _.every(
                        exclusions.map(re => re.test(d['@url']) === false)
                    );
                })
                .filter(d => {
                    return (
                        filters.length === 0 ||
                        _.every(filters.map(re => re.test(d['@url']) === true))
                    );
                });

            const tests = uniq.slice(START, START + LIMIT).reduce((aggr, d) => {
                try {
                    const url = d['@url']
                        .replace(/^"|"$/g, '')
                        .replace(/^\/\/[^\/]*/, '')
                        .replace(/\/api\//, '/api/column-store/');

                    const label = d['@url']
                        .match(/\/api\/[^\/]*/i)[0]
                        .replace(/\/api\//, '')
                        .toUpperCase();

                    aggr.push({
                        hash: d['@hash'],
                        label,
                        data: JSON.parse(d['@data']),
                        url,
                    });
                } catch (err) {
                    console.log(err);
                }
                return aggr;
            }, []);

            const fakeFiles = [
                {
                    file: 'fake',
                    suites: [
                        {
                            tests,
                        },
                    ],
                },
            ];
            //console.log(JSON.stringify(tests,3));

            return fakeFiles;
        });

    runSpecs(files, axios, 'https://beta.cbioportal.org', undefined, onFail);
}

main();

const onFail = args => {
    const url = args.url;
    const options = {
        // headers: {
        //     'x-header': 'test',
        //     'x-header2': 'test2'
        // },
        body: JSON.stringify(args.data),
        method: 'POST',
        //args: ['-vvv']
    };

    console.log(formatCurl(url, options));
};

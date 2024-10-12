const csv = require('csvtojson');
var csvFilePath = './extract-2024-10-11T11_47_07.957Z.csv';

csvFilePath = 'extract-2024-10-12T19_34_07.810Z.csv';

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

const hashes = [];

const START = 1;
const LIMIT = 1000;

async function main() {
    const files = await csv()
        .fromFile(csvFilePath)
        .then(async jsonObj => {
            let uniq = _.uniqBy(jsonObj, '@hash')
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
                })
                .filter(d => {
                    return (
                        hashes.length === 0 ||
                        _.every(hashes.map(re => re.test(d['@hash']) === true))
                    );
                });

            //uniq = uniq.filter(m=>m["@hash"]=="-1827897056")

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

            return fakeFiles;
        });

    runSpecs(files, axios, 'http://localhost:8082', 'verboses', onFail);
}

main();

const onFail = args => {
    //console.log(args);

    const url = 'http://localhost:8082' + args.url;
    // const options = {
    //     // headers: {
    //     //     'x-header': 'test',
    //     //     'x-header2': 'test2'
    //     // },
    //     body: JSON.stringify(args.data),
    //     method: 'POST',
    //     //args: ['-vvv']
    // };

    const curl = `
        curl '${url}' 
          -H 'accept: application/json, text/plain, */*' 
          -H 'accept-language: en-US,en;q=0.9' 
          -H 'cache-control: no-cache' 
          -H 'content-type: application/json' 
          -H 'cookie: _ga_ET18FDC3P1=GS1.1.1727902893.87.0.1727902893.0.0.0; _gid=GA1.2.1570078648.1728481898; _ga_CKJ2CEEFD8=GS1.1.1728589307.172.1.1728589613.0.0.0; _ga_5260NDGD6Z=GS1.1.1728612388.318.1.1728612389.0.0.0; _gat_gtag_UA_17134933_2=1; _ga=GA1.1.1260093286.1710808634; _ga_334HHWHCPJ=GS1.1.1728647421.32.1.1728647514.0.0.0' 
          -H 'pragma: no-cache' 
          -H 'priority: u=1, i'  
          -H 'sec-ch-ua: "Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"' 
          -H 'sec-ch-ua-mobile: ?0' 
          -H 'sec-ch-ua-platform: "macOS"' 
          -H 'sec-fetch-dest: empty' 
          -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36' 
          --data-raw '${JSON.stringify(args.data)}';
    `;

    //console.log(url);
    //console.log(JSON.stringify(args.data));

    // console.log(
    //     curl
    //         .trim()
    //         .split('\n')
    //         .join('')
    // );
    //
    // console.log(
    //     `http://localhost:8082/study/summary?id=ov_tcga_pan_can_atlas_2018#filterJson=${encodeURIComponent(
    //         JSON.stringify(args.data)
    //     )}`
    // );
};

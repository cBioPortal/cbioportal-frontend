const csv = require('csvtojson');
const csvFilePath = './extract-2024-10-08T16_34_22.764Z.csv';
const _ = require('lodash');

var najax = require('najax');
var { runSpecs } = require('./validation');

const exclusions = [/clinical-data-density/, /molecular-profile-sample/];
const filters = [/clinical-event-type/];

const START = 5;
const LIMIT = 5;

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
                    return _.every(
                        filters.map(re => re.test(d['@url']) === true)
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
            return fakeFiles;
        });

    runSpecs(files, najax, 'https://beta.cbioportal.org');
}

main();

const file = [
    {
        name: '',
        note: '',
        studies: [],
        tests: [
            {
                hash: 788956100,
                filterString: '',
                data: {
                    attributes: [
                        {
                            attributeId: 'CANCER_TYPE',
                        },
                        {
                            attributeId: 'CANCER_TYPE_DETAILED',
                        },
                        {
                            attributeId: 'SAMPLE_COUNT',
                        },
                        {
                            attributeId: 'SEX',
                        },
                        {
                            attributeId: 'ETHNICITY',
                        },
                        {
                            attributeId: 'SAMPLE_TYPE',
                        },
                        {
                            attributeId: 'CENTER',
                        },
                        {
                            attributeId: 'ONCOTREE_CODE',
                        },
                        {
                            attributeId: 'PRIMARY_RACE',
                        },
                        {
                            attributeId: 'SAMPLE_TYPE_DETAILED',
                        },
                        {
                            attributeId: 'SEQ_ASSAY_ID',
                        },
                        {
                            attributeId: 'DEAD',
                        },
                    ],
                    studyViewFilter: {
                        studyIds: ['genie_public'],
                        alterationFilter: {
                            copyNumberAlterationEventTypes: {
                                AMP: true,
                                HOMDEL: true,
                            },
                            mutationEventTypes: {
                                any: true,
                            },
                            structuralVariants: null,
                            includeDriver: true,
                            includeVUS: true,
                            includeUnknownOncogenicity: true,
                            includeUnknownTier: true,
                            includeGermline: true,
                            includeSomatic: true,
                            includeUnknownStatus: true,
                            tiersBooleanMap: {},
                        },
                    },
                },
                url: '/api/column-store/clinical-data-counts/fetch?',
                label: 'ClinicalDataCounts',
                studies: ['genie_public'],
                filterUrl:
                    '/study/summary?id=genie_public#filterJson={"studyIds":["genie_public"],"alterationFilter":{"copyNumberAlterationEventTypes":{"AMP":true,"HOMDEL":true},"mutationEventTypes":{"any":true},"structuralVariants":null,"includeDriver":true,"includeVUS":true,"includeUnknownOncogenicity":true,"includeUnknownTier":true,"includeGermline":true,"includeSomatic":true,"includeUnknownStatus":true,"tiersBooleanMap":{}}}',
            },
        ],
    },
];

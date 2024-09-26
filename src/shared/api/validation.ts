import _ from 'lodash';
import { array } from 'yargs';

export const isObject = (value: any) => {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof RegExp) &&
        !(value instanceof Date) &&
        !(value instanceof Set) &&
        !(value instanceof Map)
    );
};

export function dynamicSortSingle(property: string) {
    var sortOrder = 1;
    if (property[0] === '-') {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function(a: any, b: any) {
        /* next line works with strings and numbers,
         * and you may want to customize it to your needs
         */
        var result =
            a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
        return result * sortOrder;
    };
}

export function dynamicSort(property: string[]) {
    if (property.length === 1) {
        return dynamicSortSingle(property[0]);
    } else {
        const prop1 = property[0];
        const prop2 = property[1];
        return function(a: any, b: any) {
            /* next line works with strings and numbers,
             * and you may want to customize it to your needs
             */
            let af = a[prop1];
            let bf = b[prop1];
            let as = a[prop2];
            let bs = b[prop2];

            // If first value is same
            if (af == bf) {
                return as < bs ? -1 : as > bs ? 1 : 0;
            } else {
                return af < bf ? -1 : 1;
            }
        };
    }
}

export function getArrays(inp: any, output: Array<any>) {
    if (inp instanceof Array) {
        output.push(inp);
        inp.forEach(n => getArrays(n, output));
    } else if (isObject(inp)) {
        // this is to get rid of discrepancy deep in decimals
        _.forEach(inp, (v, k) => {
            if (/\d\.\d{10,}$/.test(v)) {
                inp[k] = inp[k].toFixed(5);
            }
        });

        // this is get rid
        delete inp.matchingGenePanelIds;
        delete inp.cytoband;
        delete inp.numberOfProfiledCases;

        // do nothing
        Object.values(inp).forEach(nn => getArrays(nn, output));
    }
    return output;
}

const deleteFields: Record<string, string[]> = {
    MolecularProfileSample: ['label'],
    CaseList: ['label'],
};

const sortFields: Record<string, string> = {
    ClinicalDataBin: 'attributeId,specialValue',
    FilteredSamples: 'patientId,sampleId',
    SampleTreatmentCounts: 'treatment,time',
    PatientTreatmentCounts: 'treatment',
};

function getLegacyPatientTreatmentCountUrl(url: string) {
    return url.replace(
        /api\/treatments\/patient-counts\/fetch?/,
        'api/treatments/patient'
    );
}

function getLegacySampleTreatmentCountUrl(url: string) {
    return url.replace(
        /api\/treatments\/sample-counts\/fetch?/,
        'api/treatments/sample'
    );
}

const treatmentLegacyUrl: Record<string, (url: string) => string> = {
    PatientTreatmentCounts: getLegacyPatientTreatmentCountUrl,
    SampleTreatmentCounts: getLegacySampleTreatmentCountUrl,
};

const treatmentConverter: Record<string, (legacyData: any) => any> = {
    PatientTreatmentCounts: convertLegacyPatientTreatmentCountsToCh,
    SampleTreatmentCounts: convertLegacySampleTreatmentCountsToCh,
};

function convertLegacySampleTreatmentCountsToCh(legacyData: any) {
    const sampleIdSet = new Set();
    const treatments: Array<{
        time: string;
        treatment: string;
        count: number;
        samples: Array<any>;
    }> = [];

    legacyData.forEach((legacySampleTreatment: any) => {
        let treatment = {
            time: legacySampleTreatment['time'],
            treatment: legacySampleTreatment['treatment'],
            count: legacySampleTreatment['count'],
            samples: new Array(),
        };

        treatments.push(treatment);
        const samples = legacySampleTreatment['samples'];
        if (samples instanceof Array) {
            samples.forEach(sample => {
                sampleIdSet.add(sample['sampleId']);
            });
        }
    });
    return {
        totalSamples: sampleIdSet.size,
        treatments: treatments,
    };
}

function convertLegacyPatientTreatmentCountsToCh(legacyData: any) {
    const patientIdSet = new Set();
    const treatments: Array<{ treatment: string; count: number }> = [];

    legacyData.forEach((legacyTreatment: any) => {
        let treatment = {
            treatment: legacyTreatment['treatment'],
            count: legacyTreatment['count'],
        };
        treatments.push(treatment);

        const samples = legacyTreatment['samples'];
        if (samples instanceof Array) {
            samples.forEach(sample => {
                patientIdSet.add(sample['patientId']);
            });
        }
    });

    return {
        totalPatients: patientIdSet.size,
        totalSamples: 0,
        patientTreatments: treatments,
    };
}

export function deepSort(inp: any, label: string) {
    const arrs = getArrays(inp, []);

    arrs.forEach(arr => {
        if (label in deleteFields) {
            arr.forEach((m: any) => {
                deleteFields[label].forEach(l => {
                    delete m[l];
                });
            });
        }

        if (!arr.length) return;
        if (!isObject(arr[0])) {
            arr.sort();
        } else {
            // it's an array of objects

            // this is going to make sure the keys in the objects
            // are in a sorted order
            arr.forEach((o: any) => {
                _.keys(o)
                    .sort()
                    .forEach(k => {
                        const val = o[k];
                        delete o[k];
                        o[k] = val;
                    });
            });

            //927275539

            if (sortFields[label]) {
                attemptSort(sortFields[label].split(','), arr);
            } else {
                const fields = [
                    'attributeId',
                    'value',
                    'hugoGeneSymbol',
                    'uniqueSampleKey',
                    'alteration',
                ];
                fields.forEach(f => attemptSort([f], arr));
            }
        }
    });

    return inp;
}

function attemptSort(keys: string[], arr: any) {
    arr.sort(dynamicSort(keys));
}

export function compareCounts(clData: any, legacyData: any, label: string) {
    const clDataSorted = deepSort(clData, label);
    var legacyDataSorted = deepSort(legacyData, label);

    if (treatmentConverter[label]) {
        legacyDataSorted = treatmentConverter[label](legacyDataSorted);
    }
    const result =
        JSON.stringify(clDataSorted) === JSON.stringify(legacyDataSorted);

    return {
        clDataSorted,
        legacyDataSorted,
        status: result,
        label,
    };
}

export function validate(
    url: string,
    params: any,
    label: string,
    hash: number,
    body?: any,
    elapsedTime?: any,
    assertResponse?: any[]
) {
    const clStart = performance.now();
    let chDuration: number, legacyDuration: number;

    let chXHR: any;

    if (body) {
        chXHR = Promise.resolve({ body, elapsedTime });
    } else {
        if (
            assertResponse &&
            assertResponse[0] &&
            assertResponse[0].attributeId
        ) {
            let data: any = {};
            data['attributes'] = [
                { attributeId: assertResponse[0].attributeId },
            ];
            if (params.studyViewFilter) {
                const {
                    attributes,
                    ...filteredStudyViewFilter
                } = params.studyViewFilter;
                data['studyViewFilter'] = filteredStudyViewFilter;
            } else {
                data['studyViewFilter'] = params;
            }
            chXHR = $.ajax({
                method: 'post',
                url: '/api/column-store/clinical-data-counts/fetch?',
                data: JSON.stringify(data),
                contentType: 'application/json',
            }).then((body, state, xhr) => {
                return {
                    body,
                    elapsedTime: xhr.getResponseHeader('elapsed-time'),
                };
            });
        } else {
            chXHR = $.ajax({
                method: 'post',
                url: url,
                data: JSON.stringify(params),
                contentType: 'application/json',
            }).then((body, state, xhr) => {
                return {
                    body,
                    elapsedTime: xhr.getResponseHeader('elapsed-time'),
                };
            });
        }
    }

    return chXHR
        .then(({ body, elapsedTime }: any) => {
            const legacyXHR: PromiseLike<any> = assertResponse
                ? Promise.resolve(assertResponse)
                : $.ajax({
                      method: 'post',
                      url: treatmentLegacyUrl[label]
                          ? treatmentLegacyUrl[label](
                                url.replace(/column-store\//, '')
                            )
                          : url.replace(/column-store\//, ''),
                      data: JSON.stringify(params),
                      contentType: 'application/json',
                  });

            return legacyXHR.then(legacyResult => {
                const result: any = compareCounts(
                    body,
                    legacyResult,
                    assertResponse ? 'ClinicalDataCounts' : label
                );
                result.url = url;
                result.hash = hash;
                result.data = params;
                result.chDuration = parseFloat(elapsedTime);

                result.legacyDuration =
                    !assertResponse &&
                    parseFloat(
                        (legacyXHR as JQuery.jqXHR<any>).getResponseHeader(
                            'elapsed-time'
                        ) || '0'
                    );

                return result;
            });
        })
        .catch(() => {
            const result: any = {};
            result.url = url;
            result.hash = hash;
            result.status = false;
            result.data = params;
            result.httpError = true;
            return result;
        });
}

export function reportValidationResult(result: any, prefix = '') {
    const skipMessage =
        result.test && result.test.skip ? `(SKIPPED ${result.test.skip})` : '';

    !result.status &&
        console.groupCollapsed(
            `${prefix} ${result.label} (${result.hash}) ${skipMessage} failed :(`
        );

    !result.status &&
        console.log('failed test', {
            url: result.url,
            test: result.test,
            studies: result?.test?.studies,
            legacyDuration: result.legacyDuration,
            chDuration: result.chDuration,
            equal: result.status,
            httpError: result.httpError,
        });

    const passedMessage = `${prefix} ${result.label} (${
        result.hash
    }) passed :) ch: ${result.chDuration.toFixed(0)} ${
        result.legacyDuration
            ? `legacy: ${result.legacyDuration.toFixed(0)}`
            : `assertResponse detected`
    }`;

    result.status && console.log(passedMessage);

    if (!result.status) {
        _.forEach(result.clDataSorted, (cl: any, i: number) => {
            if (
                JSON.stringify(cl) !==
                JSON.stringify(result.legacyDataSorted[i])
            ) {
                console.groupCollapsed(`First invalid item (${result.label})`);
                console.log('Clickhouse:', cl);
                console.log('Legacy:', result.legacyDataSorted[i]);
                console.groupEnd();
                return false;
            }
        });
        console.groupCollapsed('All Data');
        console.log('legacy', result.legacyDataSorted);
        console.log('CH', result.clDataSorted);
        console.groupEnd();
    }

    !result.status && console.groupEnd();
}

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
        for (const k in inp) {
            if (/\d\.\d{10,}$/.test(inp[k])) {
                try {
                    inp[k] = inp[k].toFixed(5);
                } catch (ex) {}
            }
        }

        if (inp.counts) {
            inp.counts = inp.counts.filter((n: any) => {
                return n.label != 'NA';
            });
        }

        // this is get rid if extraneouys properties that conflict
        delete inp.matchingGenePanelIds;
        delete inp.cytoband;
        delete inp.numberOfProfiledCases;

        Object.values(inp).forEach(nn => getArrays(nn, output));
    }
    return output;
}

const deleteFields: Record<string, string[]> = {
    MolecularProfileSampleCounts: ['label'],
    CaseList: ['label'],
    SampleListCounts: ['label'],
    CnaGenes: ['qValue'],
    MutatedGenes: ['qValue'],
};

const sortFields: Record<string, string> = {
    ClinicalDataBinCounts: 'attributeId,specialValue',
    FilteredSamples: 'studyId,patientId,sampleId',
    SampleTreatmentCounts: 'treatment,time',
    PatientTreatmentCounts: 'treatment',
    ClinicalDataCounts: 'attributeId,value',
    ClinicalDataTypeCounts: 'eventType',
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
            count: legacySampleTreatment['count'],
            samples: new Array(),
            time: legacySampleTreatment['time'],
            treatment: legacySampleTreatment['treatment'],
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
            count: legacyTreatment['count'],
            treatment: legacyTreatment['treatment'],
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

        arr.forEach((m: any) => {
            if (m.value) m.value = m.value.toLowerCase();
        });

        if (!arr.length) return;
        if (!isObject(arr[0])) {
            arr.sort();
        } else {
            // it's an array of objects

            // this is going to make sure the keys in the objects
            // are in a sorted order
            arr.forEach((o: any) => {
                Object.keys(o)
                    .sort()
                    .forEach(k => {
                        const val = o[k];
                        delete o[k];
                        o[k] = val;
                    });
            });

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

let win: any;

try {
    win = window;
} catch (ex) {
    win = {};
}

function removeElement(nums: any[], val: any) {
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] === val) {
            nums.splice(i, 1);
            i--;
        }
    }
}

export function compareCounts(clData: any, legacyData: any, label: string) {
    // @ts-ignore
    const clDataClone = win.structuredClone ? structuredClone(clData) : clData;

    const legacyDataClone = win.structuredClone
        ? // @ts-ignore
          structuredClone(legacyData)
        : legacyData;

    var clDataSorted = deepSort(clDataClone, label);
    var legacyDataSorted = deepSort(legacyDataClone, label);

    getArrays(clDataSorted, []).forEach((arr: any) => {
        arr.filter(n => /NA/i.test(n.value)).forEach((val: any) => {
            removeElement(arr, val);
        });
    });

    getArrays(legacyDataSorted, []).forEach((arr: any) => {
        arr.filter(n => /NA/i.test(n.value)).forEach((val: any) => {
            removeElement(arr, val);
        });
    });

    // get rid of these little guys
    if (clDataSorted)
        clDataSorted = clDataSorted.filter((n: any) => n.specialValue != 'NA');

    if (legacyDataSorted)
        legacyDataSorted = legacyDataSorted.filter(
            (n: any) => n.specialValue != 'NA'
        );

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

export async function validate(
    ajax: any,
    url: string,
    params: any,
    label: string,
    hash: number,
    body?: any,
    elapsedTime: any = 0,
    assertResponse: any[] | undefined = undefined,
    onFail: (...args: any[]) => void = () => {}
) {
    let chXHR: any;

    let chResult;
    let legacyResult;

    if (body) {
        chResult = { body, elapsedTime, status: 200 };
    } else {
        chResult = await ajax
            .post(url, params)
            .then(function(response: any) {
                return {
                    status: response.status,
                    body: response.data,
                    elapsedTime: response.headers['elapsed-time'],
                };
            })
            .catch(function(error: any) {
                return {
                    body: null,
                    error,
                    elapsedTime: null,
                    status: error.status,
                };
            });
    }

    if (assertResponse) {
        legacyResult = assertResponse;
    } else {
        let legacyUrl = url.replace(/column-store\//, '');

        if (treatmentLegacyUrl[label]) {
            legacyUrl = treatmentLegacyUrl[label](legacyUrl);
        }

        legacyResult = await ajax
            .post(legacyUrl, params)
            .then(function(response: any) {
                return {
                    status: response.status,
                    body: response.data,
                    elapsedTime: response.headers['elapsed-time'],
                };
            })
            .catch(function(error: any) {
                return {
                    body: null,
                    error,
                    elapsedTime: null,
                    status: error.status,
                };
            });
    }

    const result: any = compareCounts(chResult.body, legacyResult.body, label);
    result.url = url;
    result.hash = hash;
    result.data = params;
    result.chDuration = chResult.elapsedTime;
    result.legacyDuration = !assertResponse && legacyResult.elapsedTime;
    result.chError = chResult.error;

    if (!result.status) {
        onFail(url);
    }

    return result;
}

const red = '\x1b[31m';
const green = '\x1b[32m';
const reset = '\x1b[0m';

export function reportValidationResult(
    result: any,
    prefix = '',
    logLevel = ''
) {
    const skipMessage =
        result.test && result.test.skip ? `(SKIPPED ${result.test.skip})` : '';

    const errorStatus = result.chError ? `(${result.chError.status})` : '';

    !result.status &&
        console.groupCollapsed(
            `${red} ${prefix} ${result.label} (${result.hash}) ${skipMessage} failed ${errorStatus} :( ${reset}`
        );

    if (logLevel === 'verbose' && !result.status) {
        console.log('failed test', {
            url: result.url,
            test: result.test,
            studies: result?.test?.studies,
            legacyDuration: result.legacyDuration,
            chDuration: result.chDuration,
            equal: result.status,
            httpError: result.httpError,
        });
    }

    if (result.status) {
        console.log(
            `${prefix} ${result.label} (${result.hash}) passed :) ch: ${
                result.chDuration
            } legacy: ${result.legacyDuration && result.legacyDuration}`
        );
    }

    if (!result.status && logLevel == 'verbose') {
        if (result?.clDataSorted?.length) {
            for (var i = 0; i < result?.clDataSorted?.length; i++) {
                const cl = result.clDataSorted[i];
                if (
                    JSON.stringify(cl) !==
                    JSON.stringify(result.legacyDataSorted[i])
                ) {
                    console.groupCollapsed(
                        `First invalid item (${result.label})`
                    );
                    console.log('Clickhouse:', cl);
                    console.log('Legacy:', result.legacyDataSorted[i]);
                    console.groupEnd();
                    break;
                }
            }
        }
        // console.groupCollapsed('All Data');
        // console.log('legacy', result.legacyDataSorted);
        // console.log('CH', result.clDataSorted);
        // console.groupEnd();
    }

    !result.status && console.groupEnd();
}

export async function runSpecs(
    files: any,
    axios: any,
    host: string = '',
    logLevel = '',
    onFail: any = () => {}
) {
    // @ts-ignore
    const allTests = files
        // @ts-ignore
        .flatMap((n: any) => n.suites)
        // @ts-ignore
        .flatMap((n: any) => n.tests);

    const totalCount = allTests.length;

    const onlyDetected = allTests.some((t: any) => t.only === true);

    console.log(`Running specs (${files.length} of ${totalCount})`);

    if (logLevel === 'verbose') {
        console.groupCollapsed('specs');
        //console.log('raw', json);
        console.log('filtered', files);
        console.groupEnd();
    }

    let place = 0;
    let errors: any[] = [];
    let skips: any[] = [];
    let passed: any[] = [];
    let httpErrors: any[] = [];

    const invokers: (() => Promise<any>)[] = [] as any;
    files
        .map((f: any) => f.suites)
        .forEach((suite: any) => {
            suite.forEach((col: any) =>
                col.tests.forEach((test: any) => {
                    test.url = test.url.replace(
                        /column-store\/api/,
                        'column-store'
                    );

                    if (!onlyDetected || test.only) {
                        invokers.push(
                            // @ts-ignore
                            () => {
                                return validate(
                                    axios,
                                    host + test.url,
                                    test.data,
                                    test.label,
                                    test.hash,
                                    undefined,
                                    undefined,
                                    test.assertResponse
                                ).then((report: any) => {
                                    if (!report.status) {
                                        onFail(test);
                                    }

                                    report.test = test;
                                    place = place + 1;
                                    const prefix = `${place} of ${totalCount}`;
                                    if (report instanceof Promise) {
                                        report.then((report: any) => {
                                            if (test?.skip) {
                                                skips.push(test.hash);
                                            } else if (!report.status) {
                                                report.httpError
                                                    ? httpErrors.push(test.hash)
                                                    : errors.push(test.hash);
                                            } else if (report.status)
                                                passed.push(test.hash);

                                            reportValidationResult(
                                                report,
                                                prefix,
                                                logLevel
                                            );
                                        });
                                    } else {
                                        if (test?.skip) {
                                            skips.push(test.hash);
                                        } else if (!report.status) {
                                            report.httpError
                                                ? httpErrors.push(test.hash)
                                                : errors.push(test.hash);
                                        } else if (report.status)
                                            passed.push(test.hash);

                                        reportValidationResult(
                                            report,
                                            prefix,
                                            logLevel
                                        );
                                    }
                                });
                            }
                        );
                    }
                })
            );
        });

    const concurrent = 3;
    const batches = Math.ceil(invokers.length / concurrent);

    for (var i = 0; i < batches; i++) {
        const proms = [];
        for (const inv of invokers.slice(
            i * concurrent,
            (i + 1) * concurrent
        )) {
            proms.push(inv());
        }
        await Promise.all(proms);
    }

    console.group('FINAL REPORT');
    console.log(`PASSED: ${passed.length} of ${totalCount}`);
    console.log(`FAILED: ${errors.length} (${errors.join(',')})`);
    console.log(`HTTP ERRORS: ${httpErrors.length} (${httpErrors.join(',')})`);
    console.log(`SKIPPED: ${skips.length}  (${skips.join(',')})`);
    console.groupEnd();
    // console.groupEnd();
}

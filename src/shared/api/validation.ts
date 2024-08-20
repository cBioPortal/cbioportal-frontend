import _ from 'lodash';

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

const sortFields: Record<string, string> = {
    ClinicalDataBin: 'attributeId,specialValue',
    FilteredSamples: 'patientId,sampleId',
};

export function deepSort(inp: any, label: string) {
    const arrs = getArrays(inp, []);

    arrs.forEach(arr => {
        if (!arr.length) return;
        if (!isObject(arr[0])) {
            arr.sort();
        } else {
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
    const legacyDataSorted = deepSort(legacyData, label);

    const result =
        JSON.stringify(clDataSorted) === JSON.stringify(legacyDataSorted);

    return {
        clDataSorted,
        legacyDataSorted,
        status: result,
        label,
    };
}

export function validate(url: string, params: any, label: string) {
    const clStart = performance.now();
    let chDuration: number, legacyDuration: number;
    return $.ajax({
        method: 'post',
        url: url,
        data: JSON.stringify(params),
        contentType: 'application/json',
    }).then(chResult => {
        const legacyUrl = url.replace(/column-store\//, '');
        chDuration = performance.now() - clStart;
        const legacyStart = performance.now();

        return $.ajax({
            method: 'post',
            url: legacyUrl,
            data: JSON.stringify(params),
            contentType: 'application/json',
        }).then(legacyResult => {
            legacyDuration = performance.now() - legacyStart;
            const result: any = compareCounts(chResult, legacyResult, label);
            result.chDuration = chDuration;
            result.legacyDuration = legacyDuration;
            return result;
        });
    });
}

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

export function dynamicSort(property: string) {
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

        // do nothing
        Object.values(inp).forEach(nn => getArrays(nn, output));
    }
    return output;
}

export function deepSort(inp: any) {
    const arrs = getArrays(inp, []);

    arrs.forEach(arr => {
        if (!arr.length) return;
        if (!isObject(arr[0])) {
            arr.sort();
        } else {
            const fields = [
                'attributeId',
                'value',
                'hugoGeneSymbol',
                'uniqueSampleKey',
                'alteration',
            ];
            fields.forEach(f => attemptSort(f, arr));
        }
    });

    return inp;
}

function attemptSort(key: string, arr: any) {
    if (key in arr[0]) arr.sort(dynamicSort(key));
}

export function compareCounts(clData: any, legacyData: any, label: string) {
    const clDataSorted = deepSort(clData);
    const legacyDataSorted = deepSort(legacyData);

    const result =
        JSON.stringify(clDataSorted) === JSON.stringify(legacyDataSorted);

    if (result === false) {
        _.forEach(clDataSorted, (cl: any, i: number) => {
            if (JSON.stringify(cl) !== JSON.stringify(legacyDataSorted[i])) {
                console.log(
                    `first invalid item (${label})`,
                    'Clickhouse:',
                    cl,
                    'Legacy:',
                    legacyDataSorted[i]
                );
                return false;
            }
        });
    }

    return {
        status: result,
    };
}

export function validate(url: string, params: any, label: string) {
    const clStart = performance.now();
    let chDuration: number, legacyDuration: number;
    $.ajax({
        method: 'post',
        url: url,
        data: JSON.stringify(params),
        contentType: 'application/json',
    }).then(chResult => {
        const legacyUrl = url.replace(/column-store\//, '');
        chDuration = performance.now() - clStart;
        const legacyStart = performance.now();

        $.ajax({
            method: 'post',
            url: legacyUrl,
            data: JSON.stringify(params),
            contentType: 'application/json',
        }).then(legacyResult => {
            legacyDuration = performance.now() - legacyStart;
            const result = compareCounts(chResult, legacyResult, label);
            !result.status &&
                console.log({
                    url,
                    legacyDuration,
                    chDuration: chDuration,
                    equal: result.status,
                });

            result.status && console.log(`${label} passed!`);
        });
    });
}

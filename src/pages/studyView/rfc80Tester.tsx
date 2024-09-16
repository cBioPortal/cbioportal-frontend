import * as React from 'react';
import _ from 'lodash';
import { useCallback, useEffect } from 'react';
import { reportValidationResult, validate } from 'shared/api/validation';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';
import { SAVE_TEST_KEY } from 'shared/api/testMaker';

const CACHE_KEY: string = 'testCache';

const RFC_TEST_SHOW: string = 'RFC_TEST_SHOW';

const LIVE_VALIDATE_KEY: string = 'LIVE_VALIDATE_KEY';

function getCache() {
    return getBrowserWindow()[CACHE_KEY] || {};
    //return localStorage.getItem(CACHE_KEY);
}

function clearCache() {
    getBrowserWindow()[CACHE_KEY] = {};
}

export const RFC80Test = observer(function() {
    const store = useLocalObservable<any>(() => ({
        tests: [],
        show: !!localStorage.getItem(RFC_TEST_SHOW),
        listening: !!localStorage.getItem(SAVE_TEST_KEY),
        validate: !!localStorage.getItem(LIVE_VALIDATE_KEY),
    }));

    const clearCacheCallback = useCallback(() => {
        clearCache();
    }, []);

    const toggleListener = useCallback(() => {
        store.listening = !store.listening;
        if (getBrowserWindow().localStorage.getItem(SAVE_TEST_KEY)) {
            getBrowserWindow().localStorage.removeItem(SAVE_TEST_KEY);
        } else {
            getBrowserWindow().localStorage.setItem(SAVE_TEST_KEY, 'true');
        }
    }, []);

    const toggleShow = useCallback(() => {
        !!localStorage.getItem(RFC_TEST_SHOW)
            ? localStorage.removeItem(RFC_TEST_SHOW)
            : localStorage.setItem(RFC_TEST_SHOW, 'true');
        store.show = !store.show;
    }, []);

    const toggleLiveValidate = useCallback(() => {
        !!localStorage.getItem(LIVE_VALIDATE_KEY)
            ? localStorage.removeItem(LIVE_VALIDATE_KEY)
            : localStorage.setItem(LIVE_VALIDATE_KEY, 'true');
        store.validate = !store.validate;
    }, []);

    const runTests = useCallback(async () => {
        let json = [];

        try {
            json = await $.getJSON(
                'https://localhost:3000/common/merged-tests.json'
            );
        } catch (ex) {
            alert('merged-tests.json not found');
        }

        const fileFilter = $('#apiTestFilter')
            .val()
            ?.toString();

        const files: any[] = fileFilter?.trim().length
            ? json.filter((f: any) => new RegExp(fileFilter).test(f.file))
            : json;

        const totalCount = _(files)
            .flatMap('suites')
            .flatMap('tests')
            .value().length;

        console.group(`Running specs (${files.length} of ${totalCount})`);

        console.groupCollapsed('specs');
        console.log('raw', json);
        console.log('filtered', files);
        console.groupEnd();

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

                        invokers.push(
                            // @ts-ignore
                            () => {
                                return validate(
                                    test.url,
                                    test.data,
                                    test.label,
                                    test.hash,
                                    undefined,
                                    undefined,
                                    col.assertResponse
                                ).then((report: any) => {
                                    report.test = test;
                                    place = place + 1;
                                    const prefix = `${place} of ${totalCount}`;

                                    if (test?.skip) {
                                        skips.push(test.hash);
                                    } else if (!report.status) {
                                        report.httpError
                                            ? httpErrors.push(test.hash)
                                            : errors.push(test.hash);
                                    } else if (report.status)
                                        passed.push(test.hash);

                                    reportValidationResult(report, prefix);
                                });
                            }
                        );
                    })
                );
            });

        for (const el of invokers) {
            await el();
        }

        console.group('FINAL REPORT');
        console.log(`PASSED: ${passed.length} of ${totalCount}`);
        console.log(`FAILED: ${errors.length} (${errors.join(',')})`);
        console.log(
            `HTTP ERRORS: ${httpErrors.length} (${httpErrors.join(',')})`
        );
        console.log(`SKIPPED: ${skips.length}  (${skips.join(',')})`);
        console.groupEnd();

        //Promise.all(promises).then(() => {
        console.groupEnd();
        // });
    }, []);

    useEffect(() => {
        if (getCache()) {
            const tests = getCache();
            const parsed = _.values(tests).map((j: any) => j);
            store.tests = parsed;
        }

        const checker = setInterval(() => {
            if (getCache()) {
                const tests = getCache();
                const parsed = _.values(tests);
                store.tests = parsed;
            } else {
                store.tests = [];
            }
        }, 1000);

        return () => {
            clearInterval(checker);
        };
    }, []);

    const txt = `
    {   
        "name":"",
        "note":"",
        "studies":[],
        "tests":[
            ${store.tests.map((t: any) => JSON.stringify(t)).join(',\n\n')}
        ]
    }`;

    if (!store.show) {
        return (
            <div
                className={'positionAbsolute'}
                style={{
                    top: 0,
                    right: 0,
                    border: '1px solid #dddddd',
                    background: 'white',
                    overflow: 'scroll',
                    zIndex: 10000,
                }}
            >
                <button onClick={toggleShow}>Show</button>
            </div>
        );
    }

    return (
        <div
            className={'positionAbsolute'}
            style={{
                top: 0,
                right: 0,
                padding: 5,
                border: '1px solid #dddddd',
                width: 500,
                minHeight: 100,
                background: 'white',
                overflow: 'scroll',
                zIndex: 10000,
            }}
        >
            <button onClick={toggleShow}>Hide</button>
            <button onClick={clearCacheCallback}>
                Clear Test Cache ({store.tests.length})
            </button>
            <button onClick={toggleListener}>
                {store.listening ? 'Stop Listening' : 'Listen'}
            </button>
            <button onClick={toggleLiveValidate}>
                {store.validate ? 'Stop Validate' : 'Validate'}
            </button>
            <button onClick={runTests}>Run tests</button>
            <input
                placeholder={'spec name filter'}
                id={'apiTestFilter'}
            ></input>
            {
                <textarea
                    style={{ width: '100%', height: '1000px' }}
                    value={txt}
                ></textarea>
            }
        </div>
    );
});

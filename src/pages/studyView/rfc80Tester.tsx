import * as React from 'react';
import _ from 'lodash';
import json from '../../../apiTests/merged-tests.json';
import { useCallback, useEffect } from 'react';
import { reportValidationResult, validate } from 'shared/api/validation';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';
import { SAVE_TEST_KEY } from 'shared/api/testMaker';

getBrowserWindow().showTest = function() {};

const CACHE_KEY: string = 'testCache';

function getCache() {
    return getBrowserWindow()[CACHE_KEY] || {};
    //return localStorage.getItem(CACHE_KEY);
}

function clearCache() {
    getBrowserWindow()[CACHE_KEY] = {};
    //localStorage.removeItem(CACHE_KEY);
}

export const RFC80Test = observer(function() {
    const store = useLocalObservable<any>(() => ({
        tests: [],
    }));

    const clearCacheCallback = useCallback(() => {
        clearCache();
    }, []);

    const toggleListener = useCallback(() => {
        if (getBrowserWindow().localStorage.getItem(SAVE_TEST_KEY)) {
            getBrowserWindow().localStorage.removeItem(SAVE_TEST_KEY);
        } else {
            getBrowserWindow().localStorage.setItem(SAVE_TEST_KEY, 'true');
        }
    }, []);

    const runTests = useCallback(() => {
        const totalCount = _(json)
            .flatMap('suites')
            .flatMap('tests')
            .value().length;

        console.group(`Running specs (${totalCount})`);

        let place = 0;

        const promises: Promise<any>[] = [];
        json.map((f: any) => f.suites).forEach((suite: any) => {
            suite.forEach((col: any) =>
                col.tests.forEach((test: any) => {
                    test.url = test.url.replace(
                        /column-store\/api/,
                        'column-store'
                    );

                    promises.push(
                        // @ts-ignore
                        validate(
                            test.url,
                            test.data,
                            test.label,
                            test.hash
                        ).then((report: any) => {
                            report.test = test;
                            place = place + 1;
                            const prefix = `${place} of ${totalCount}`;
                            reportValidationResult(report, prefix);
                        })
                    );
                })
            );
        });

        Promise.all(promises).then(() => {
            console.groupEnd();
        });
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
            <button onClick={clearCacheCallback}>
                Clear Test Cache ({store.tests.length})
            </button>
            <button onClick={toggleListener}>Listen</button>
            <button onClick={runTests}>Run tests</button>
            {
                <textarea
                    style={{ width: '100%', height: '1000px' }}
                    value={txt}
                ></textarea>
            }
        </div>
    );
});

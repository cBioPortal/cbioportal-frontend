import * as React from 'react';
import _ from 'lodash';
import json from './data.json';
import { useCallback, useEffect } from 'react';
import { validate } from 'shared/api/validation';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import { useLocalObservable } from 'mobx-react-lite';

getBrowserWindow().showTest = function() {};

const CACHE_KEY: string = 'testCache';

export const RFC80Test = observer(function() {
    const store = useLocalObservable<any>(() => ({
        tests: [],
    }));

    const clearCache = useCallback(() => {
        localStorage.removeItem(CACHE_KEY);
    }, []);

    const runTests = useCallback(() => {
        json.forEach((subject: any) => {
            subject.url = subject.url.replace(
                /column-store\/api/,
                'column-store'
            );
            validate(subject.url, subject.data, subject.filterUrl).then(
                report => {
                    if (report.status) {
                        console.log('Test passed', subject.url);
                    } else {
                        console.log('Test failed', report);
                    }
                }
            );
        });
    }, []);

    useEffect(() => {
        if (localStorage.getItem(CACHE_KEY)) {
            const tests = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
            const parsed = _.values(tests).map((j: any) => JSON.parse(j));
            store.tests = parsed;
        }

        const checker = setInterval(() => {
            if (localStorage.getItem(CACHE_KEY)) {
                const tests = JSON.parse(localStorage.testCache);
                const parsed = _.values(tests).map((j: any) => JSON.parse(j));
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
        [
        ${store.tests.map((t: any) => JSON.stringify(t)).join(',\n\n')}
        ]
    `;

    return (
        <div
            className={'positionAbsolute'}
            style={{
                top: 0,
                right: 0,
                paddingTop: 20,
                width: 500,
                minHeight: 100,
                background: 'white',
                overflow: 'scroll',
            }}
        >
            <button onClick={clearCache}>
                Clear Test Cache ({store.tests.length})
            </button>
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

import { getBrowserWindow, hashString } from 'cbioportal-frontend-commons';
import { toJS } from 'mobx';
import _ from 'lodash';

export const SAVE_TEST_KEY = 'save_test_enabled';

export async function makeTest(data: any, url: string) {
    const hash = hashString(JSON.stringify({ data, url }));

    const filterString = $('.userSelections')
        .find('*')
        .contents()
        .filter(function() {
            return this.nodeType === 3;
        })
        .toArray()
        .map(n => n.textContent)
        .slice(0, -1)
        .reduce((acc, s) => {
            switch (s) {
                case null:
                    acc += '';
                    break;
                case '(':
                    acc += ' (';
                    break;
                case ')':
                    acc += ') ';
                    break;
                case 'or':
                    acc += ' OR ';
                    break;
                case 'and':
                    acc += ' AND ';
                    break;
                default:
                    acc += s || '';
                    break;
            }
            return acc;
        }, '');

    const entry = {
        hash,
        filterString,
        data,
        url,
        studies: toJS(getBrowserWindow().studyViewPageStore.studyIds),
        filterUrl: (await getBrowserWindow().studyPage.getBookmarkUrl())
            .fullUrl,
    };

    if (getBrowserWindow().localStorage.getItem(SAVE_TEST_KEY))
        saveTest(hash, entry);
}

function saveTest(hash: number, entry: any) {
    const testCache = JSON.parse(getBrowserWindow().testCache || '{}');

    if (!(hash in testCache)) {
        testCache[hash] = JSON.stringify(entry);
        getBrowserWindow().testCache = JSON.stringify(testCache);
    }
}

import { getBrowserWindow, hashString } from 'cbioportal-frontend-commons';
import { toJS } from 'mobx';
import _ from 'lodash';

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

    saveTest(hash, entry);
}

function saveTest(hash: number, entry: any) {
    const testCache = JSON.parse(
        getBrowserWindow().localStorage.testCache || '{}'
    );

    if (!(hash in testCache)) {
        testCache[hash] = JSON.stringify(entry);
        getBrowserWindow().localStorage.setItem(
            'testCache',
            JSON.stringify(testCache)
        );
    }
}

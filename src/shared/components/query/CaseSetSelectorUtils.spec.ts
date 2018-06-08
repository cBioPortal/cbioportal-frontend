import { assert } from 'chai';
import Sinon from 'sinon';
import { getFilteredCustomCaseSets, CustomCaseSets } from 'shared/components/query/CaseSetSelectorUtils';

describe('CaseSetSelectorUtils', () => {
    describe('filterCustomCaseSets', () => {
        it("returns only custom case set if there is one physical study selected ", () => {
            assert.deepEqual(getFilteredCustomCaseSets(false, {} as any), [CustomCaseSets[4]]);
            assert.deepEqual(getFilteredCustomCaseSets(false, {} as any), [CustomCaseSets[4]]);
            assert.deepEqual(getFilteredCustomCaseSets(false, { w_mut: 100, w_cna: 100, w_mut_cna: 100, all:100 }), [CustomCaseSets[4]]);
        });

        it("returns correct filtered case sets depending on the samples when mutli/virtual studies selected", () => {
            assert.deepEqual(getFilteredCustomCaseSets(true, { w_mut: 50, w_cna: 50, w_mut_cna: 50, all:100 }).map(obj => obj.value).sort(), ['-1', 'all', 'w_cna', 'w_mut', 'w_mut_cna']);
            assert.deepEqual(getFilteredCustomCaseSets(true, { w_mut: 0, w_cna: 50, w_mut_cna: 50, all:100 }).map(obj => obj.value).sort(), ['-1', 'all', 'w_cna', 'w_mut_cna']);
            assert.deepEqual(getFilteredCustomCaseSets(true, { w_mut: 50, w_cna: 0, w_mut_cna: 50, all:100 }).map(obj => obj.value).sort(), ['-1', 'all', 'w_mut', 'w_mut_cna']);
            assert.deepEqual(getFilteredCustomCaseSets(true, { w_mut: 50, w_cna: 50, w_mut_cna: 0, all:100 }).map(obj => obj.value).sort(), ['-1', 'all', 'w_cna', 'w_mut']);
            assert.deepEqual(getFilteredCustomCaseSets(true, { w_mut: 50, w_cna: 0, w_mut_cna: 0, all:100 }).map(obj => obj.value).sort(), ['-1', 'all', 'w_mut']);
            assert.deepEqual(getFilteredCustomCaseSets(true, { w_mut: 0, w_cna: 50, w_mut_cna: 0, all:100 }).map(obj => obj.value).sort(), ['-1', 'all', 'w_cna']);
            assert.deepEqual(getFilteredCustomCaseSets(true, { w_mut: 0, w_cna: 0, w_mut_cna: 50, all:100 }).map(obj => obj.value).sort(), ['-1', 'all', 'w_mut_cna']);
            assert.deepEqual(getFilteredCustomCaseSets(true, { w_mut: 0, w_cna: 0, w_mut_cna: 0, all:100 }).map(obj => obj.value).sort(), ['-1', 'all']);
        });

    })
})
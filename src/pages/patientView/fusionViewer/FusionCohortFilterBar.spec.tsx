import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import { FusionCohortFilterBar } from './FusionCohortFilterBar';
import { FusionCohortStore } from './FusionCohortStore';
import { DEMO_COHORT_STRUCTURAL_VARIANTS } from './data/demoCohortSample';

function storeWithDemo(): FusionCohortStore {
    const store = new FusionCohortStore();
    store.setStructuralVariants(DEMO_COHORT_STRUCTURAL_VARIANTS);
    return store;
}

describe('FusionCohortFilterBar', () => {
    it('changing the frame select updates the filter', () => {
        const store = storeWithDemo();
        const wrapper = mount(<FusionCohortFilterBar store={store} />);
        wrapper
            .find('select[data-test="frame-select"]')
            .simulate('change', { target: { value: 'inFrame' } });
        assert.equal(store.filter.inFrame, 'inFrame');
    });

    it('clear-all resets the filter', () => {
        const store = storeWithDemo();
        store.setInFrameFilter('outOfFrame');
        const wrapper = mount(<FusionCohortFilterBar store={store} />);
        wrapper.find('button[data-test="clear-all"]').simulate('click');
        assert.equal(store.filter.inFrame, 'any');
        assert.deepEqual(store.filter.genePartners, []);
    });
});

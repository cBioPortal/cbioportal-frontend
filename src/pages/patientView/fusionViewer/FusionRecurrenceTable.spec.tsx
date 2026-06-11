import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import { FusionRecurrenceTable } from './FusionRecurrenceTable';
import { FusionCohortStore } from './FusionCohortStore';
import { DEMO_COHORT_STRUCTURAL_VARIANTS } from './data/demoCohortSample';

function storeWithDemo(): FusionCohortStore {
    const store = new FusionCohortStore();
    store.setStructuralVariants(DEMO_COHORT_STRUCTURAL_VARIANTS);
    return store;
}

describe('FusionRecurrenceTable', () => {
    it('renders one row per pair summary', () => {
        const store = storeWithDemo();
        const wrapper = mount(<FusionRecurrenceTable store={store} />);
        assert.include(wrapper.text(), 'ERG::TMPRSS2');
        assert.include(wrapper.text(), 'KMT2A::-');
    });

    it('clicking a row toggles that pair into the filter', () => {
        const store = storeWithDemo();
        const wrapper = mount(<FusionRecurrenceTable store={store} />);
        wrapper
            .find('[data-test="pair-row-ERG::TMPRSS2"]')
            .first()
            .simulate('click');
        assert.deepEqual(store.filter.fusionPairKeys, ['ERG::TMPRSS2']);
    });
});

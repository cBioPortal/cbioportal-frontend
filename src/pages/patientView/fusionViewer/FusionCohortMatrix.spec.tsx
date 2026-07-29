import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import { FusionCohortMatrix } from './FusionCohortMatrix';
import { FusionCohortStore } from './FusionCohortStore';
import { DEMO_COHORT_STRUCTURAL_VARIANTS } from './data/demoCohortSample';

function storeWithDemo(): FusionCohortStore {
    const store = new FusionCohortStore();
    store.setStructuralVariants(DEMO_COHORT_STRUCTURAL_VARIANTS);
    return store;
}

describe('FusionCohortMatrix', () => {
    it('renders a present cell for a sample/pair that exists', () => {
        const store = storeWithDemo();
        const wrapper = mount(<FusionCohortMatrix store={store} />);
        const cell = wrapper.find('[data-test="cell-ERG::TMPRSS2-SAMPLE_001"]');
        assert.isAbove(cell.length, 0);
        assert.equal(cell.first().prop('data-present'), 'true');
    });

    it('renders an absent cell for a sample without that pair', () => {
        const store = storeWithDemo();
        const wrapper = mount(<FusionCohortMatrix store={store} />);
        const cell = wrapper.find('[data-test="cell-ERG::TMPRSS2-SAMPLE_004"]');
        assert.equal(cell.first().prop('data-present'), 'false');
    });

    it('a sample-header link points to that sample fusion viewer', () => {
        const store = storeWithDemo();
        const wrapper = mount(<FusionCohortMatrix store={store} />);
        const link = wrapper.find('a[data-test="sample-link-SAMPLE_001"]');
        assert.include(
            link.first().prop('href') as string,
            'patient/fusionViewer'
        );
        assert.include(
            link.first().prop('href') as string,
            'sampleId=SAMPLE_001'
        );
    });

    it('shows a cap notice only when capped', () => {
        const store = storeWithDemo();
        const wrapper = mount(<FusionCohortMatrix store={store} />);
        assert.isFalse(wrapper.text().includes('showing top'));
    });
});

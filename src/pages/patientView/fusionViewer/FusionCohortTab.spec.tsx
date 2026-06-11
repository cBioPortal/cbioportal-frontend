import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import { FusionCohortTab } from './FusionCohortTab';
import { DEMO_COHORT_STRUCTURAL_VARIANTS } from './data/demoCohortSample';

describe('FusionCohortTab', () => {
    it('shows the empty state when there is no SV data', () => {
        const wrapper = mount(<FusionCohortTab structuralVariants={[]} />);
        assert.include(wrapper.text(), 'No structural variant / fusion data');
    });

    it('renders the panels when given cohort data', () => {
        const wrapper = mount(
            <FusionCohortTab
                structuralVariants={DEMO_COHORT_STRUCTURAL_VARIANTS}
            />
        );
        assert.include(wrapper.text(), 'ERG::TMPRSS2'); // table + matrix
        assert.isAbove(
            wrapper.find('select[data-test="frame-select"]').length,
            0
        ); // filter bar present
    });
});

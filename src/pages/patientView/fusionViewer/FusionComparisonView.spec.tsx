import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import FusionComparisonView from './FusionComparisonView';
import { FusionCohortStore } from './FusionCohortStore';

jest.mock('./data/genomeNexusTranscriptService', () => ({
    fetchTranscriptsForGeneWithFallback: jest.fn(() => Promise.resolve([])),
}));

describe('FusionComparisonView', () => {
    it('renders the alignment toggle and reacts to store anchor', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                site1Position: 100,
            } as any,
        ]);
        store.setAnchor({ mode: 'driver', key: 'TMPRSS2' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        assert.lengthOf(
            wrapper.find('[data-testid="alignment-toggle"]').hostNodes(),
            1
        );
    });

    it('toggling alignment updates the store', () => {
        const store = new FusionCohortStore();
        store.setAnchor({ mode: 'driver', key: 'TMPRSS2' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        wrapper
            .find('[data-testid="alignment-toggle"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.equal(store.alignment, 'coordinate');
    });
});

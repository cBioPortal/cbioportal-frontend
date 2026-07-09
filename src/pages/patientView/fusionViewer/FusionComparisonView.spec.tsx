import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import FusionComparisonView, {
    FUSION_BREAKPOINT_FILTER_KEY,
} from './FusionComparisonView';
import { FusionCohortStore } from './FusionCohortStore';

jest.mock('./data/genomeNexusTranscriptService', () => ({
    fetchTranscriptsForGeneWithFallback: jest.fn(() => Promise.resolve([])),
}));

describe('FusionComparisonView', () => {
    it('renders the histogram-mode toggle and reacts to store anchor', () => {
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
            wrapper.find('[data-testid="trackmode-feature"]').hostNodes(),
            1
        );
    });

    it('the histogram mode toggle switches the store between feature and genomic', () => {
        const store = new FusionCohortStore();
        store.setAnchor({ mode: 'driver', key: 'TMPRSS2' });
        const wrapper = mount(<FusionComparisonView store={store} />);
        assert.equal(store.trackMode, 'feature');
        wrapper
            .find('[data-testid="trackmode-genomic"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.equal(store.trackMode, 'genomic');
        wrapper
            .find('[data-testid="trackmode-feature"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.equal(store.trackMode, 'feature');
    });

    it('clicking a fusion-summary-row sets store.anchor to the pair', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                site1Position: 100,
            } as any,
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S2',
                site1Position: 100,
            } as any,
        ]);
        const wrapper = mount(<FusionComparisonView store={store} />);
        const row = wrapper
            .find('[data-testid="fusion-summary-row"]')
            .hostNodes()
            .first();
        row.simulate('click');
        assert.isDefined(store.anchor);
        assert.equal(store.anchor!.mode, 'pair');
    });

    it('maps a clicked bar to distinct SampleIdentifiers (with studyId) and calls the filter callback', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                studyId: 'study_a',
                site1Position: 100,
            } as any,
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S2',
                studyId: 'study_b',
                site1Position: 200,
            } as any,
        ]);
        const spy = jest.fn();
        const wrapper = mount(
            <FusionComparisonView store={store} onFilterCohortBySamples={spy} />
        );
        const instance = wrapper.instance() as any;

        // Rows for this pair anchor, in the same order the ruler bins them.
        const rows = store.comparisonRows;
        const sampleIds = rows.map(r => r.sampleId);
        // Click a bar whose members are row indices 0 and 1.
        instance.handleSelectBar(
            sampleIds,
            { members: [0, 1], label: 'E1' },
            'TMPRSS2'
        );

        assert.isTrue(spy.mock.calls.length === 1);
        const [filterKey, label, samples] = spy.mock.calls[0];
        assert.equal(filterKey, FUSION_BREAKPOINT_FILTER_KEY);
        assert.include(label, 'E1');
        assert.deepEqual(
            samples
                .slice()
                .sort((a: any, b: any) => a.sampleId.localeCompare(b.sampleId)),
            [
                { studyId: 'study_a', sampleId: 'S1' },
                { studyId: 'study_b', sampleId: 'S2' },
            ]
        );
    });

    it('dedupes samples and skips out-of-range member indices', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                studyId: 'study_a',
                site1Position: 100,
            } as any,
        ]);
        const spy = jest.fn();
        const wrapper = mount(
            <FusionComparisonView store={store} onFilterCohortBySamples={spy} />
        );
        const instance = wrapper.instance() as any;
        // members reference the same sample twice + an undefined index.
        instance.handleSelectBar(
            ['S1', 'S1'],
            { members: [0, 1, 99], label: 'E1' },
            'TMPRSS2'
        );
        const [, , samples] = spy.mock.calls[0];
        assert.deepEqual(samples, [{ studyId: 'study_a', sampleId: 'S1' }]);
    });

    it('does not throw when no filter callback is provided', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            {
                site1HugoSymbol: 'TMPRSS2',
                site2HugoSymbol: 'ERG',
                sampleId: 'S1',
                studyId: 'study_a',
                site1Position: 100,
            } as any,
        ]);
        const wrapper = mount(<FusionComparisonView store={store} />);
        const instance = wrapper.instance() as any;
        instance.handleSelectBar(
            ['S1'],
            { members: [0], label: 'E1' },
            'TMPRSS2'
        );
        // no throw, nothing to assert beyond reaching here
        assert.isTrue(true);
    });
});

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

// A cohort with more pairs than one page holds, for the pagination tests.
function storeWithManyPairs(pairCount: number): FusionCohortStore {
    const store = new FusionCohortStore();
    const svs = [];
    for (let i = 0; i < pairCount; i++) {
        svs.push({
            sampleId: 'S' + i,
            studyId: 'demo_cohort',
            molecularProfileId: 'demo_cohort_fusion',
            site1HugoSymbol: 'AAA' + i,
            site2HugoSymbol: 'BBB' + i,
            site1Chromosome: '1',
            site2Chromosome: '1',
            site1Position: 1000 + i,
            site2Position: 2000 + i,
            ncbiBuild: 'GRCh38',
            variantClass: 'FUSION',
        });
    }
    store.setStructuralVariants(svs as any);
    return store;
}

describe('FusionRecurrenceTable', () => {
    it('renders one row per pair summary', () => {
        const store = storeWithDemo();
        const wrapper = mount(<FusionRecurrenceTable store={store} />);
        assert.include(wrapper.text(), 'ERG::TMPRSS2');
        assert.include(wrapper.text(), 'KMT2A::-');
    });

    it('titles itself for fusions when annotation is available', () => {
        const store = storeWithDemo();
        const wrapper = mount(
            <FusionRecurrenceTable store={store} hasFusionAnnotation={true} />
        );
        assert.include(wrapper.text(), 'Top recurrent fusions');
    });

    it('titles itself for gene pairs when annotation is unavailable', () => {
        const store = storeWithDemo();
        const wrapper = mount(
            <FusionRecurrenceTable store={store} hasFusionAnnotation={false} />
        );
        assert.include(wrapper.text(), 'Top SV gene pairs');
    });

    it('clicking a pair sets it as the comparison anchor', () => {
        const store = storeWithDemo();
        const wrapper = mount(<FusionRecurrenceTable store={store} />);
        wrapper
            .find('[data-test="pair-row-ERG::TMPRSS2"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.deepEqual(store.anchor, {
            mode: 'pair',
            key: 'ERG::TMPRSS2',
        });
    });

    it('clicking a pair leaves the cohort filter untouched', () => {
        const store = storeWithDemo();
        const wrapper = mount(<FusionRecurrenceTable store={store} />);
        wrapper
            .find('[data-test="pair-row-ERG::TMPRSS2"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.deepEqual(store.filter.fusionPairKeys, []);
    });

    it('checking the filter box selects that pair', () => {
        const store = storeWithDemo();
        const wrapper = mount(<FusionRecurrenceTable store={store} />);
        wrapper
            .find('[data-test="pair-filter-ERG::TMPRSS2"]')
            .hostNodes()
            .first()
            .simulate('change');
        assert.deepEqual(store.filter.fusionPairKeys, ['ERG::TMPRSS2']);
    });

    it('unchecking the filter box clears the filter', () => {
        const store = storeWithDemo();
        store.selectOnlyFusionPairKey('ERG::TMPRSS2');
        const wrapper = mount(<FusionRecurrenceTable store={store} />);
        wrapper
            .find('[data-test="pair-filter-ERG::TMPRSS2"]')
            .hostNodes()
            .first()
            .simulate('change');
        assert.deepEqual(store.filter.fusionPairKeys, []);
    });

    it('marks the anchored pair so it reads as selected', () => {
        const store = storeWithDemo();
        store.setAnchor({ mode: 'pair', key: 'ERG::TMPRSS2' });
        const wrapper = mount(<FusionRecurrenceTable store={store} />);
        assert.equal(
            wrapper
                .find('[data-test="pair-row-ERG::TMPRSS2"]')
                .hostNodes()
                .first()
                .prop('data-anchored'),
            true
        );
    });
    it('checking one pair leaves the other pairs visible and selectable', () => {
        const store = storeWithDemo();
        const wrapper = mount(<FusionRecurrenceTable store={store} />);
        wrapper
            .find('[data-test="pair-filter-ERG::TMPRSS2"]')
            .hostNodes()
            .first()
            .simulate('change');
        wrapper.update();

        // The pair facet must not remove its own unselected options.
        assert.include(wrapper.text(), 'CCDC6::RET');
        wrapper
            .find('[data-test="pair-filter-CCDC6::RET"]')
            .hostNodes()
            .first()
            .simulate('change');
        // Single-select: the new pick replaces the old one.
        assert.deepEqual(store.filter.fusionPairKeys, ['CCDC6::RET']);
    });

    it('checking a pair that is not the anchor re-anchors instead of blanking the comparison', () => {
        const store = storeWithDemo();
        store.setAnchor({ mode: 'pair', key: 'CCDC6::RET' });
        const wrapper = mount(<FusionRecurrenceTable store={store} />);
        wrapper
            .find('[data-test="pair-filter-ERG::TMPRSS2"]')
            .hostNodes()
            .first()
            .simulate('change');
        assert.deepEqual(store.anchor, {
            mode: 'pair',
            key: 'ERG::TMPRSS2',
        });
        assert.isAbove(store.comparisonRows.length, 0);
    });
    it('shows only the first page of pairs when the cohort has more', () => {
        const store = storeWithManyPairs(35);
        const wrapper = mount(<FusionRecurrenceTable store={store} />);
        assert.equal(
            wrapper.find('[data-test^="pair-row-"]').hostNodes().length,
            25
        );
    });

    it('reports the page range rather than the whole cohort', () => {
        const store = storeWithManyPairs(35);
        const wrapper = mount(<FusionRecurrenceTable store={store} />);
        assert.include(wrapper.text(), 'Showing 1-25 of 35');
    });

    it('does not paginate a cohort that fits on one page', () => {
        const store = storeWithManyPairs(12);
        const wrapper = mount(<FusionRecurrenceTable store={store} />);
        assert.equal(
            wrapper.find('[data-test^="pair-row-"]').hostNodes().length,
            12
        );
    });
});

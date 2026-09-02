import { assert } from 'chai';
import { StudyViewPageStore } from './StudyViewPageStore';
import { ChartTypeEnum } from './StudyViewConfig';
import { SampleIdentifier } from 'cbioportal-ts-api-client';

// The Top SV Gene Pairs card and the SV/Fusion Comparison tab both install
// labeled sample-identifier filters through the same store map. Resetting the
// card must not take the Comparison tab's filter with it.
describe('StudyViewPageStore SV gene pair filters', () => {
    const TOP_SV_CARD_KEY = 'sv-profile_TOP_SV_GENE_PAIRS_TABLE';
    const GENE_PAIR_KEY = 'GENEA::GENEB';
    // Mirrors FUSION_BREAKPOINT_FILTER_KEY in
    // pages/patientView/fusionViewer/FusionComparisonView.tsx.
    const FUSION_BREAKPOINT_KEY = 'FUSION_BREAKPOINT_BAR';

    const samples: SampleIdentifier[] = [
        { studyId: 'study1', sampleId: 'sample1' },
        { studyId: 'study1', sampleId: 'sample2' },
    ];
    const breakpointSamples: SampleIdentifier[] = [
        { studyId: 'study1', sampleId: 'sample3' },
    ];

    function makeStore(): StudyViewPageStore {
        const store = new StudyViewPageStore(
            {} as any,
            false,
            {} as any,
            {} as any
        );
        store.chartsType.set(
            TOP_SV_CARD_KEY,
            ChartTypeEnum.TOP_SV_GENE_PAIRS_TABLE
        );
        return store;
    }

    it('resetting the Top SV Gene Pairs card clears only its own gene-pair filters', () => {
        const store = makeStore();
        store.toggleSvGenePairSamples(GENE_PAIR_KEY, samples, 'GENEA-GENEB');
        store.selectSvGenePairSamples(
            FUSION_BREAKPOINT_KEY,
            breakpointSamples,
            'Breakpoint 1,000-2,000'
        );
        assert.equal(store.svGenePairSampleFilters.length, 2);

        store.resetFilterAndChangeChartVisibility(TOP_SV_CARD_KEY, false);

        const remaining = store.svGenePairSampleFilters;
        assert.deepEqual(
            remaining.map(f => f.uniqueKey),
            [FUSION_BREAKPOINT_KEY],
            "the Comparison tab's breakpoint pill must survive"
        );
        assert.equal(remaining[0].numSamples, 1);
        assert.deepEqual(store.selectedSvGenePairKeys, []);
    });

    it('isChartFiltered is false for the card when only the breakpoint filter exists', () => {
        const store = makeStore();
        store.selectSvGenePairSamples(
            FUSION_BREAKPOINT_KEY,
            breakpointSamples,
            'Breakpoint 1,000-2,000'
        );
        assert.isFalse((store as any).isChartFiltered(TOP_SV_CARD_KEY));

        store.toggleSvGenePairSamples(GENE_PAIR_KEY, samples, 'GENEA-GENEB');
        assert.isTrue((store as any).isChartFiltered(TOP_SV_CARD_KEY));
    });

    it('clearSvGenePairSampleFilters leaves the breakpoint filter installed', () => {
        const store = makeStore();
        store.toggleSvGenePairSamples(GENE_PAIR_KEY, samples, 'GENEA-GENEB');
        store.selectSvGenePairSamples(
            FUSION_BREAKPOINT_KEY,
            breakpointSamples,
            'Breakpoint 1,000-2,000'
        );

        store.clearSvGenePairSampleFilters();

        assert.deepEqual(
            store.svGenePairSampleFilters.map(f => f.uniqueKey),
            [FUSION_BREAKPOINT_KEY]
        );
    });

    it('clearAllFilters still drops the breakpoint filter too', () => {
        const store = makeStore();
        store.toggleSvGenePairSamples(GENE_PAIR_KEY, samples, 'GENEA-GENEB');
        store.selectSvGenePairSamples(
            FUSION_BREAKPOINT_KEY,
            breakpointSamples,
            'Breakpoint 1,000-2,000'
        );

        store.clearAllFilters();

        assert.deepEqual(store.svGenePairSampleFilters, []);
    });
});

import { assert } from 'chai';
import { StudyViewPageStore } from './StudyViewPageStore';
import { ChartTypeEnum } from './StudyViewConfig';
import { SampleIdentifier } from 'cbioportal-ts-api-client';

// The SV/Fusion Comparison tab filters the cohort by breakpoint bar / collapsed
// group through selectSvGenePairSamples; a label turns that filter into a
// removable pill in the study-view header.
describe('StudyViewPageStore SV gene pair filters', () => {
    // Mirrors FUSION_BREAKPOINT_FILTER_KEY in
    // pages/patientView/fusionViewer/FusionComparisonView.tsx.
    const FUSION_BREAKPOINT_KEY = 'FUSION_BREAKPOINT_BAR';

    const breakpointSamples: SampleIdentifier[] = [
        { studyId: 'study1', sampleId: 'sample3' },
    ];

    function makeStore(): StudyViewPageStore {
        return new StudyViewPageStore({} as any, false, {} as any, {} as any);
    }

    it('a labeled filter is listed as a pill with its sample count', () => {
        const store = makeStore();
        store.selectSvGenePairSamples(
            FUSION_BREAKPOINT_KEY,
            breakpointSamples,
            'Breakpoint 1,000-2,000'
        );
        assert.deepEqual(store.svGenePairSampleFilters, [
            {
                uniqueKey: FUSION_BREAKPOINT_KEY,
                label: 'Breakpoint 1,000-2,000',
                numSamples: 1,
            },
        ]);
    });

    it('an unlabeled filter gets no pill', () => {
        const store = makeStore();
        store.selectSvGenePairSamples(FUSION_BREAKPOINT_KEY, breakpointSamples);
        assert.deepEqual(store.svGenePairSampleFilters, []);
    });

    it('removing the pill drops the filter', () => {
        const store = makeStore();
        store.selectSvGenePairSamples(
            FUSION_BREAKPOINT_KEY,
            breakpointSamples,
            'Breakpoint 1,000-2,000'
        );
        store.removeSvGenePairSampleFilter(FUSION_BREAKPOINT_KEY);
        assert.deepEqual(store.svGenePairSampleFilters, []);
    });

    it('clearAllFilters drops the breakpoint filter too', () => {
        const store = makeStore();
        store.selectSvGenePairSamples(
            FUSION_BREAKPOINT_KEY,
            breakpointSamples,
            'Breakpoint 1,000-2,000'
        );

        store.clearAllFilters();

        assert.deepEqual(store.svGenePairSampleFilters, []);
    });
});

describe('StudyViewPageStore svGenesTableFilterGenes', () => {
    it('lists genes filtered in SV genes table charts only', () => {
        const store = new StudyViewPageStore(
            {} as any,
            false,
            {} as any,
            {} as any
        );
        const SV_KEY = 'sv-profile_STRUCTURAL_VARIANT_GENES_TABLE';
        const MUT_KEY = 'mut-profile_MUTATED_GENES_TABLE';
        store.chartsType.set(
            SV_KEY,
            ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE
        );
        store.chartsType.set(MUT_KEY, ChartTypeEnum.MUTATED_GENES_TABLE);
        store.addGeneFilters({ uniqueKey: SV_KEY } as any, [['ALK']]);
        store.addGeneFilters({ uniqueKey: MUT_KEY } as any, [['TP53']]);
        assert.deepEqual(store.svGenesTableFilterGenes, ['ALK']);
    });
});

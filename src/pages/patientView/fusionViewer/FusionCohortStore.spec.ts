import { assert } from 'chai';
import { autorun } from 'mobx';
import { FusionCohortStore } from './FusionCohortStore';
import { FusionEvent } from './data/types';
import { ComparisonAnchor } from './data/comparisonRows';

// ---------------------------------------------------------------------------
// Mock adapter — same pattern as FusionViewerStore.spec.ts
// ---------------------------------------------------------------------------

jest.mock('./data/structuralVariantAdapter', () => ({
    convertStructuralVariantsToFusionEvents: jest.fn((svs: any[]) =>
        // Treat the input objects AS FusionEvents directly so tests can provide
        // FusionEvent-shaped objects to setStructuralVariants.
        svs.map((sv: any) => sv as FusionEvent)
    ),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<FusionEvent> = {}): FusionEvent {
    return {
        id: 'S1_GENE_A_GENE_B_5000_8000',
        ncbiBuild: '',
        tumorId: 'SAMPLE_001',
        gene1: {
            symbol: 'GENE_A',
            chromosome: '1',
            position: 5000,
            selectedTranscriptId: '',
            siteDescription: '',
        },
        gene2: {
            symbol: 'GENE_B',
            chromosome: '2',
            position: 8000,
            selectedTranscriptId: '',
            siteDescription: '',
        },
        fusion: 'GENE_A::GENE_B',
        eventLabel: '',
        totalReadSupport: 10,
        callMethod: 'FUSION',
        frameCallMethod: 'in_frame',
        annotation: '',
        position: '',
        significance: 'NA',
        note: '',
        connectionType: '5to3',
        svIdiom: 'INTERGENIC_FUSION',
        frame: 'IN_FRAME',
        isRnaDerived: true,
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FusionCohortStore', () => {
    let store: FusionCohortStore;

    beforeEach(() => {
        store = new FusionCohortStore();
    });

    describe('initial state', () => {
        it('has no structural variants', () => {
            assert.equal(store.structuralVariants.length, 0);
        });

        it('allEvents is empty', () => {
            assert.equal(store.allEvents.length, 0);
        });

        it('filter is default', () => {
            assert.equal(store.filter.inFrame, 'any');
            assert.deepEqual(store.filter.genePartners, []);
            assert.deepEqual(store.filter.fusionPairKeys, []);
            assert.deepEqual(store.filter.svTypes, []);
            assert.isUndefined(store.filter.breakpointRegion);
        });
    });

    describe('setStructuralVariants', () => {
        it('populates allEvents via adapter', () => {
            const ev1 = makeEvent({ id: 'e1' });
            const ev2 = makeEvent({ id: 'e2', tumorId: 'SAMPLE_002' });
            store.setStructuralVariants([ev1 as any, ev2 as any]);
            assert.equal(store.allEvents.length, 2);
        });

        it('resets filter to default', () => {
            store.setStructuralVariants([makeEvent() as any]);
            store.setInFrameFilter('inFrame');
            assert.equal(store.filter.inFrame, 'inFrame');

            store.setStructuralVariants([makeEvent() as any]);
            assert.equal(store.filter.inFrame, 'any');
        });
    });

    describe('updateStructuralVariants', () => {
        it('replaces the events', () => {
            store.updateStructuralVariants([
                makeEvent({ id: 'e1' }) as any,
                makeEvent({ id: 'e2', tumorId: 'SAMPLE_002' }) as any,
            ]);
            assert.equal(store.allEvents.length, 2);
        });

        it('keeps the current filter, unlike setStructuralVariants', () => {
            store.setStructuralVariants([makeEvent() as any]);
            store.setInFrameFilter('inFrame');

            // The studyView cohort recomputes on every study filter change; a
            // recompute must not wipe the user's Comparison-tab filter.
            store.updateStructuralVariants([makeEvent() as any]);
            assert.equal(store.filter.inFrame, 'inFrame');
        });
    });

    describe('filteredEvents', () => {
        beforeEach(() => {
            store.setStructuralVariants([
                makeEvent({
                    id: 'e1',
                    tumorId: 'S1',
                    frameCallMethod: 'in_frame',
                }) as any,
                makeEvent({
                    id: 'e2',
                    tumorId: 'S2',
                    frameCallMethod: 'frameshift',
                }) as any,
            ]);
        });

        it('returns all events with default filter', () => {
            assert.equal(store.filteredEvents.length, 2);
        });

        it('filters to in-frame only', () => {
            store.setInFrameFilter('inFrame');
            assert.equal(store.filteredEvents.length, 1);
            assert.equal(store.filteredEvents[0].tumorId, 'S1');
        });

        it('filters to out-of-frame only', () => {
            store.setInFrameFilter('outOfFrame');
            assert.equal(store.filteredEvents.length, 1);
            assert.equal(store.filteredEvents[0].tumorId, 'S2');
        });
    });

    describe('pairSummaries', () => {
        it('aggregates events into pair summaries', () => {
            store.setStructuralVariants([
                makeEvent({ id: 'e1', tumorId: 'S1' }) as any,
                makeEvent({ id: 'e2', tumorId: 'S2' }) as any,
            ]);
            assert.equal(store.pairSummaries.length, 1);
            assert.equal(store.pairSummaries[0].sampleCount, 2);
            assert.equal(store.pairSummaries[0].eventCount, 2);
        });

        it('reflects filter changes reactively', () => {
            store.setStructuralVariants([
                makeEvent({
                    id: 'e1',
                    tumorId: 'S1',
                    gene1: {
                        symbol: 'EWSR1',
                        chromosome: '22',
                        position: 1,
                        selectedTranscriptId: '',
                        siteDescription: '',
                    },
                    gene2: {
                        symbol: 'FLI1',
                        chromosome: '11',
                        position: 2,
                        selectedTranscriptId: '',
                        siteDescription: '',
                    },
                    frameCallMethod: 'in_frame',
                }) as any,
                makeEvent({
                    id: 'e2',
                    tumorId: 'S2',
                    frameCallMethod: 'frameshift',
                }) as any,
            ]);

            assert.equal(store.pairSummaries.length, 2);

            store.setInFrameFilter('inFrame');
            assert.equal(store.pairSummaries.length, 1);
            assert.equal(store.pairSummaries[0].key, 'EWSR1::FLI1');
        });
    });

    describe('sampleRows', () => {
        it('returns one row per distinct sample', () => {
            store.setStructuralVariants([
                makeEvent({ id: 'e1', tumorId: 'S1' }) as any,
                makeEvent({ id: 'e2', tumorId: 'S2' }) as any,
            ]);
            assert.equal(store.sampleRows.length, 2);
        });
    });

    describe('matrixIsCapped / matrixPairs', () => {
        it('matrixIsCapped is false when pairs <= MATRIX_MAX_PAIRS', () => {
            store.setStructuralVariants([makeEvent() as any]);
            assert.isFalse(store.matrixIsCapped);
        });
    });

    describe('facet option lists', () => {
        beforeEach(() => {
            store.setStructuralVariants([
                makeEvent({ id: 'e1', callMethod: 'FUSION' }) as any,
                makeEvent({
                    id: 'e2',
                    callMethod: 'DELETION',
                    gene1: {
                        symbol: 'EWSR1',
                        chromosome: '22',
                        position: 1,
                        selectedTranscriptId: '',
                        siteDescription: '',
                    },
                    gene2: null,
                }) as any,
            ]);
        });

        it('genePartnerOptions contains all distinct symbols', () => {
            assert.include(store.genePartnerOptions, 'GENE_A');
            assert.include(store.genePartnerOptions, 'GENE_B');
            assert.include(store.genePartnerOptions, 'EWSR1');
        });

        it('svTypeOptions contains all distinct callMethod values', () => {
            assert.include(store.svTypeOptions, 'FUSION');
            assert.include(store.svTypeOptions, 'DELETION');
        });
    });

    describe('junctionLabelMode', () => {
        it('defaults to inline-tooltip and updates via setter', () => {
            const store = new FusionCohortStore();
            assert.equal(store.junctionLabelMode, 'inline-tooltip');
            store.setJunctionLabelMode('gutter');
            assert.equal(store.junctionLabelMode, 'gutter');
        });
    });

    describe('histogramTranscriptIdByGene', () => {
        it('is empty by default and records a per-gene override', () => {
            const store = new FusionCohortStore();
            assert.equal(store.histogramTranscriptIdByGene.size, 0);
            store.setHistogramTranscript('TMPRSS2', 'ENST00000332149');
            assert.equal(
                store.histogramTranscriptIdByGene.get('TMPRSS2'),
                'ENST00000332149'
            );
        });
    });

    describe('comparison (anchor / alignment / comparisonRows)', () => {
        it('comparisonRows returns carrier rows for the anchor, sorted by breakpoint', () => {
            const store = new FusionCohortStore();
            store.setStructuralVariants([
                makeEvent({
                    id: 'a',
                    tumorId: 'S1',
                    gene1: {
                        symbol: 'TMPRSS2',
                        chromosome: '21',
                        position: 300,
                        selectedTranscriptId: '',
                        siteDescription: '',
                    },
                    gene2: {
                        symbol: 'ERG',
                        chromosome: '21',
                        position: 900,
                        selectedTranscriptId: '',
                        siteDescription: '',
                    },
                }) as any,
                makeEvent({
                    id: 'b',
                    tumorId: 'S2',
                    gene1: {
                        symbol: 'TMPRSS2',
                        chromosome: '21',
                        position: 100,
                        selectedTranscriptId: '',
                        siteDescription: '',
                    },
                    gene2: {
                        symbol: 'ERG',
                        chromosome: '21',
                        position: 900,
                        selectedTranscriptId: '',
                        siteDescription: '',
                    },
                }) as any,
            ]);
            store.setAnchor({ mode: 'gene', gene: 'TMPRSS2', side: '5p' });
            const rows = store.anchorRows;
            assert.equal(rows.length, 2);
            assert.equal(rows[0].anchorBreakpoint, 100);
        });

        it('alignment defaults to junction and is settable', () => {
            const store = new FusionCohortStore();
            assert.equal(store.alignment, 'junction');
            store.setAlignment('coordinate');
            assert.equal(store.alignment, 'coordinate');
        });
    });

    it('links are on by default and can be toggled', () => {
        assert.isTrue(store.showLinks);
        store.setShowLinks(false);
        assert.isFalse(store.showLinks);
    });

    describe('actions', () => {
        beforeEach(() => {
            store.setStructuralVariants([makeEvent({ id: 'e1' }) as any]);
        });

        it('setGenePartnerFilter updates filter', () => {
            store.setGenePartnerFilter(['EWSR1']);
            assert.deepEqual(store.filter.genePartners, ['EWSR1']);
        });

        it('selectOnlyFusionPairKey selects the key when not present', () => {
            store.selectOnlyFusionPairKey('GENE_A::GENE_B');
            assert.deepEqual(store.filter.fusionPairKeys, ['GENE_A::GENE_B']);
        });

        it('selectOnlyFusionPairKey clears when the key is already the selection', () => {
            store.selectOnlyFusionPairKey('GENE_A::GENE_B');
            store.selectOnlyFusionPairKey('GENE_A::GENE_B');
            assert.deepEqual(store.filter.fusionPairKeys, []);
        });

        it('selectOnlyFusionPairKey replaces a different existing selection', () => {
            store.selectOnlyFusionPairKey('GENE_A::GENE_B');
            store.selectOnlyFusionPairKey('GENE_C::GENE_D');
            assert.deepEqual(store.filter.fusionPairKeys, ['GENE_C::GENE_D']);
        });

        it('setSvTypeFilter updates filter', () => {
            store.setSvTypeFilter(['DELETION']);
            assert.deepEqual(store.filter.svTypes, ['DELETION']);
        });

        it('setInFrameFilter updates filter', () => {
            store.setInFrameFilter('inFrame');
            assert.equal(store.filter.inFrame, 'inFrame');
        });

        it('setBreakpointRegion updates filter', () => {
            store.setBreakpointRegion({
                chromosome: '1',
                start: 1000,
                end: 5000,
            });
            assert.deepEqual(store.filter.breakpointRegion, {
                chromosome: '1',
                start: 1000,
                end: 5000,
            });
        });

        it('setBreakpointRegion clears region with undefined', () => {
            store.setBreakpointRegion({
                chromosome: '1',
                start: 1000,
                end: 5000,
            });
            store.setBreakpointRegion(undefined);
            assert.isUndefined(store.filter.breakpointRegion);
        });

        it('clearFilter resets all facets', () => {
            store.setGenePartnerFilter(['GENE_A']);
            store.setInFrameFilter('inFrame');
            store.clearFilter();
            assert.deepEqual(store.filter.genePartners, []);
            assert.equal(store.filter.inFrame, 'any');
        });
    });
});

describe('FusionCohortStore exon ladder modes', () => {
    it('defaults to retained exons and the reference ladder', () => {
        const store = new FusionCohortStore();
        assert.equal(store.exonMode, 'retained');
        assert.equal(store.ladderMode, 'reference');
    });

    it('setExonMode and setLadderMode update the observables', () => {
        const store = new FusionCohortStore();
        store.setExonMode('full');
        store.setLadderMode('perRow');
        assert.equal(store.exonMode, 'full');
        assert.equal(store.ladderMode, 'perRow');
    });
});

describe('genomeBuild resolution', () => {
    let store: FusionCohortStore;
    beforeEach(() => {
        store = new FusionCohortStore();
    });

    it('uses the study build when the rows declare none', () => {
        store.setReferenceGenome('hg19');
        store.setStructuralVariants([makeEvent({ ncbiBuild: '' }) as any]);

        assert.equal(store.genomeBuild, 'GRCh37');
    });

    it('lets the rows override a study build they all disagree with', () => {
        // msktarget declares GRCh37 while every RNA fusion row is GRCh38.
        // Trusting the study compares breakpoints to exon bounds ~200kb away,
        // which yields either no retained exons (a blank strip) or the whole gene.
        store.setReferenceGenome('hg19');
        store.setStructuralVariants([
            makeEvent({ id: 'a', ncbiBuild: 'GRCh38' }) as any,
            makeEvent({ id: 'b', ncbiBuild: 'GRCh38' }) as any,
        ]);

        assert.equal(store.genomeBuild, 'GRCh38');
    });

    it('takes the most common build when rows disagree with each other', () => {
        // msktarget is exactly this case: GRCh37 IMPACT SVs alongside GRCh38
        // RNA fusions. Falling back to the study build here resolved the
        // shared anchor ladder at GRCh37 for a mostly-GRCh38 cohort, which then
        // de-aligned every RNA row through the ladderTranscript build guard.
        store.setReferenceGenome('hg19');
        store.setStructuralVariants([
            makeEvent({ id: 'a', ncbiBuild: 'GRCh38' }) as any,
            makeEvent({ id: 'b', ncbiBuild: 'GRCh38' }) as any,
            makeEvent({ id: 'c', ncbiBuild: 'GRCh37' }) as any,
        ]);

        assert.equal(store.genomeBuild, 'GRCh38');
    });

    it('breaks an exact tie toward the study build', () => {
        store.setReferenceGenome('hg19');
        store.setStructuralVariants([
            makeEvent({ id: 'a', ncbiBuild: 'GRCh38' }) as any,
            makeEvent({ id: 'b', ncbiBuild: 'GRCh37' }) as any,
        ]);

        assert.equal(store.genomeBuild, 'GRCh37');
    });

    it('ignores rows with no declared build when judging agreement', () => {
        store.setReferenceGenome('hg19');
        store.setStructuralVariants([
            makeEvent({ id: 'a', ncbiBuild: 'GRCh38' }) as any,
            makeEvent({ id: 'b', ncbiBuild: '' }) as any,
        ]);

        assert.equal(store.genomeBuild, 'GRCh38');
    });
});

// ---------------------------------------------------------------------------
// Faceted-filter semantics for the pair facet
// ---------------------------------------------------------------------------

function pairEvent(
    id: string,
    tumorId: string,
    g5: string,
    g3: string | null,
    overrides: Partial<FusionEvent> = {}
): FusionEvent {
    return makeEvent({
        id,
        tumorId,
        gene1: {
            symbol: g5,
            chromosome: '1',
            position: 100,
            selectedTranscriptId: '',
            siteDescription: '',
        },
        gene2: g3
            ? {
                  symbol: g3,
                  chromosome: '2',
                  position: 200,
                  selectedTranscriptId: '',
                  siteDescription: '',
              }
            : (undefined as any),
        ...overrides,
    });
}

describe('FusionCohortStore pair facet', () => {
    let store: FusionCohortStore;

    beforeEach(() => {
        store = new FusionCohortStore();
        store.setStructuralVariants([
            pairEvent('a', 'S1', 'TMPRSS2', 'ERG') as any,
            pairEvent('b', 'S2', 'TMPRSS2', 'ERG') as any,
            pairEvent('c', 'S3', 'EWSR1', 'FLI1') as any,
            pairEvent('d', 'S4', 'CCDC6', 'RET') as any,
        ]);
    });

    it('pairSummariesForFacet keeps every pair when one pair is checked', () => {
        store.selectOnlyFusionPairKey('ERG::TMPRSS2');
        const keys = store.pairSummariesForFacet.map(p => p.key);
        assert.deepEqual(keys.sort(), [
            'CCDC6::RET',
            'ERG::TMPRSS2',
            'EWSR1::FLI1',
        ]);
        // The narrowed list still narrows, so the strips below react.
        assert.deepEqual(
            store.pairSummaries.map(p => p.key),
            ['ERG::TMPRSS2']
        );
    });

    it('picking a pair the active filter excludes honours the pick', () => {
        store.selectOnlyFusionPairKey('ERG::TMPRSS2');
        store.setAnchor({ mode: 'pair', key: 'CCDC6::RET' });
        // The repairing getter must not silently discard an explicit pick.
        assert.deepEqual(store.anchor, {
            mode: 'pair',
            key: 'CCDC6::RET',
        });
    });

    it('picking a pair the active filter excludes clears that filter', () => {
        store.selectOnlyFusionPairKey('ERG::TMPRSS2');
        store.setAnchor({ mode: 'pair', key: 'CCDC6::RET' });
        assert.deepEqual(store.filter.fusionPairKeys, []);
    });

    it('drops a checked pair another facet has made unreachable', () => {
        store.selectOnlyFusionPairKey('ERG::TMPRSS2');
        store.setGenePartnerFilter(['EWSR1']);
        // Otherwise the checkbox is off-screen while still filtering the
        // cohort to nothing, with no way to undo it.
        assert.deepEqual(store.filter.fusionPairKeys, []);
    });

    it('keeps the comparison populated when a facet excludes the checked pair', () => {
        store.selectOnlyFusionPairKey('ERG::TMPRSS2');
        store.setGenePartnerFilter(['EWSR1']);
        assert.isAbove(store.pairSummaries.length, 0);
    });

    it('checking a second pair replaces the first', () => {
        store.selectOnlyFusionPairKey('ERG::TMPRSS2');
        store.selectOnlyFusionPairKey('CCDC6::RET');
        assert.deepEqual(store.filter.fusionPairKeys, ['CCDC6::RET']);
        assert.deepEqual(
            store.pairSummaries.map(p => p.key),
            ['CCDC6::RET']
        );
    });

    it('pairSummariesForFacet still honours the other facets', () => {
        store.setGenePartnerFilter(['EWSR1']);
        store.selectOnlyFusionPairKey('ERG::TMPRSS2');
        assert.deepEqual(
            store.pairSummariesForFacet.map(p => p.key),
            ['EWSR1::FLI1']
        );
    });

    it('re-anchors when the anchored pair is filtered out', () => {
        store.setAnchor({ mode: 'pair', key: 'CCDC6::RET' });
        store.selectOnlyFusionPairKey('ERG::TMPRSS2');
        assert.deepEqual(store.anchor, {
            mode: 'pair',
            key: 'ERG::TMPRSS2',
        });
        assert.equal(store.anchorRows.length, 2);
    });

    it('re-anchors an orphaned gene anchor too', () => {
        store.setAnchor({ mode: 'gene', gene: 'CCDC6', side: '5p' });
        store.selectOnlyFusionPairKey('ERG::TMPRSS2');
        // Gene mode falls back to the most recurrent surviving GENE (side auto).
        assert.deepEqual(store.anchor, {
            mode: 'gene',
            gene: 'ERG',
            side: '3p',
        });
    });

    it('keeps the anchor when it survives the filter', () => {
        store.setAnchor({ mode: 'pair', key: 'ERG::TMPRSS2' });
        store.selectOnlyFusionPairKey('ERG::TMPRSS2');
        assert.deepEqual(store.anchor, {
            mode: 'pair',
            key: 'ERG::TMPRSS2',
        });
    });

    it('clears the anchor when no events survive the filter', () => {
        store.setAnchor({ mode: 'pair', key: 'CCDC6::RET' });
        store.setInFrameFilter('outOfFrame');
        assert.equal(store.filteredEvents.length, 0);
        assert.isUndefined(store.anchor);
    });
    describe('transcript cache (moved from the view)', () => {
        const tx = (gene: string) =>
            ({
                transcriptId: gene,
                gene,
                genomeBuild: 'GRCh38',
                exons: [],
                strand: '+',
                txStart: 0,
                txEnd: 10,
            } as any);

        it('looks up canonical by cohort build and row isoform with canonical fallback', () => {
            store.setStructuralVariants([makeEvent()] as any);
            store.mergeTranscripts([
                ['GRCh38|GENE_A|', tx('GENE_A')],
                ['GRCh38|GENE_B|', tx('GENE_B')],
            ]);
            assert.equal(store.transcriptForGene('GENE_A')!.gene, 'GENE_A');
            const r = {
                event: makeEvent(),
                fivePrimeSymbol: 'GENE_A',
                threePrimeSymbol: 'GENE_B',
            } as any;
            assert.equal(store.transcriptForRow(r, false)!.gene, 'GENE_B');
        });

        it('failed fetch completes readiness without a transcript', () => {
            store.setStructuralVariants([makeEvent()] as any);
            store.setAnchor({ mode: 'pair', key: 'GENE_A::GENE_B' });
            assert.isFalse(store.transcriptsReady);
            store.markTranscriptsFailed(
                store.outstandingTranscriptRequests.map(
                    r => `${r.build}|${r.symbol}|${r.transcriptId}`
                )
            );
            assert.isTrue(store.transcriptsReady);
            assert.lengthOf(store.outstandingTranscriptRequests, 0);
        });

        it('picker options survive a view remount because they live in the store', () => {
            store.mergeTranscriptOptions([
                ['GRCh38|GENE_A', [tx('GENE_A'), tx('GENE_A2')]],
            ]);
            store.setHistogramTranscript('GENE_A', 'GENE_A2');
            assert.equal(
                store.histogramTranscriptForGene('GENE_A')!.transcriptId,
                'GENE_A2'
            );
        });
    });

    describe('gene anchor pipeline', () => {
        const alk = (sample: string, five: string, three: string | null) =>
            makeEvent({
                id: `${sample}-${five}-${three}`,
                tumorId: sample,
                gene1: { ...makeEvent().gene1, symbol: five },
                gene2: three ? { ...makeEvent().gene2!, symbol: three } : null,
            });

        beforeEach(() => {
            store.setStructuralVariants([
                alk('S1', 'EML4', 'ALK'),
                alk('S2', 'KIF5B', 'ALK'),
                alk('S3', 'ALK', 'PTPN3'),
                alk('S4', 'ALK', null),
                alk('S5', 'TMPRSS2', 'ERG'),
            ] as any);
        });

        it('gene mode shows only events involving the gene, on the auto side', () => {
            store.setAnchor({ mode: 'gene', gene: 'ALK', side: 'auto' });
            assert.deepEqual(store.anchor, {
                mode: 'gene',
                gene: 'ALK',
                side: '3p',
            });
            assert.sameMembers(
                store.anchorRows.map(r => r.sampleId),
                ['S1', 'S2', 'S4']
            );
            assert.equal(store.sideRows.oppositeCount, 1);
            assert.notInclude(
                store.anchorRows.map(r => r.sampleId),
                'S5'
            );
        });

        it('opposite-only gene stays selected (D14)', () => {
            store.setAnchor({ mode: 'gene', gene: 'PTPN3', side: '5p' });
            assert.deepEqual(store.anchor, {
                mode: 'gene',
                gene: 'PTPN3',
                side: '5p',
            });
            assert.lengthOf(store.anchorRows, 0);
            assert.equal(store.sideRows.oppositeCount, 1);
        });

        it('partner summaries ignore the partner facet; facet narrows rows', () => {
            store.setAnchor({ mode: 'gene', gene: 'ALK', side: '3p' });
            store.togglePartnerFacet('EML4');
            assert.deepEqual(
                store.anchorRows.map(r => r.sampleId),
                ['S1']
            );
            assert.sameMembers(
                store.partnerSummaries.map(p => p.category),
                ['EML4', 'KIF5B', '(no partner)']
            );
        });

        it('entering gene mode clears pair keys; gene change clears partner facet', () => {
            store.selectOnlyFusionPairKey('ALK::EML4');
            store.setAnchor({ mode: 'gene', gene: 'ALK', side: 'auto' });
            assert.deepEqual(store.filter.fusionPairKeys, []);
            store.togglePartnerFacet('KIF5B');
            store.setAnchorGene('ERG');
            assert.isUndefined(store.filter.anchorPartners);
        });

        it('side change keeps the facet; absent entries are ignored, not deleted', () => {
            store.setAnchor({ mode: 'gene', gene: 'ALK', side: '3p' });
            store.togglePartnerFacet('EML4');
            store.setAnchorSide('5p');
            assert.deepEqual(store.effectiveAnchorPartners, []);
            assert.deepEqual(store.filter.anchorPartners, {
                gene: 'ALK',
                partners: ['EML4'],
            });
            store.setAnchorSide('3p');
            assert.deepEqual(store.effectiveAnchorPartners, ['EML4']);
        });

        it('a side change keeps the facet while the anchor is on a fallback gene', () => {
            store.setStructuralVariants([
                alk('S1', 'EML4', 'ALK'),
                alk('S6', 'EML4', 'RET'),
                alk('S7', 'KIF5B', 'RET'),
            ] as any);
            store.setAnchor({ mode: 'gene', gene: 'ALK', side: 'auto' });
            store.setGenePartnerFilter(['RET']); // ALK orphaned -> RET effective
            assert.equal((store.anchor as any).gene, 'RET');
            store.togglePartnerFacet('EML4');
            store.setAnchorSide('3p');
            assert.deepEqual(store.filter.anchorPartners, {
                gene: 'RET',
                partners: ['EML4'],
            });
        });

        it('a fallback gene does not inherit another gene\u2019s partner selection (D30)', () => {
            store.setStructuralVariants([
                alk('S1', 'EML4', 'ALK'),
                alk('S6', 'EML4', 'RET'),
                alk('S7', 'KIF5B', 'RET'),
            ] as any);
            store.setAnchor({ mode: 'gene', gene: 'ALK', side: '3p' });
            store.togglePartnerFacet('EML4');
            store.setGenePartnerFilter(['RET']); // removes every ALK event
            // Fallback = most recurrent surviving gene: RET (2 samples), which
            // also has an EML4 partner -- the ALK-scoped selection must not apply.
            assert.equal((store.anchor as any).gene, 'RET');
            assert.deepEqual(store.effectiveAnchorPartners, []);
            assert.lengthOf(store.anchorRows, 2);
        });

        it('round trip Pair \u2192 Gene \u2192 Pair returns to an unfiltered pair table', () => {
            store.selectOnlyFusionPairKey('ALK::EML4');
            store.setAnchorMode('gene');
            store.setAnchorMode('pair');
            assert.deepEqual(store.filter.fusionPairKeys, []);
            assert.equal(store.anchor!.mode, 'pair');
            assert.isAbove(store.pairSummariesForFacet.length, 1);
        });

        it('only user picks set anchorPickedByUser', () => {
            store.setAnchor(
                { mode: 'pair', key: 'ALK::EML4' },
                { source: 'auto' }
            );
            assert.isFalse((store as any).anchorPickedByUser);
            store.setAnchor({ mode: 'pair', key: 'ALK::EML4' });
            assert.isTrue((store as any).anchorPickedByUser);
        });

        it('identity is decided once per change (acyclic)', () => {
            const spy = jest.spyOn(
                require('./data/comparisonRows'),
                'buildComparisonRows'
            );
            store.setAnchor({ mode: 'gene', gene: 'ALK', side: '3p' });
            spy.mockClear();
            // Unobserved computeds recompute on every read, so observe them
            // the way the view does; each pipeline step then runs once.
            const errors: any[] = [];
            const dispose = autorun(() => {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    store.anchorRows;
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    store.anchor;
                } catch (e) {
                    // MobX logs and swallows reaction errors (e.g. a cycle).
                    errors.push(e);
                }
            });
            // Reads outside the reaction would throw a cycle error directly.
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            store.anchorRows;
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            store.anchor;
            assert.deepEqual(errors, []);
            assert.isAtMost(spy.mock.calls.length, 1);
            dispose();
            spy.mockRestore();
        });

        it('seeds exactly one gene once data is ready; idempotent per applied gene', () => {
            const fresh = new FusionCohortStore();
            fresh.seedFromStudyFilter(['ALK'], false);
            assert.isTrue(fresh.seedPending);
            assert.isFalse(fresh.hasAnchorSelection);
            fresh.setStructuralVariants([alk('S1', 'EML4', 'ALK')] as any);
            fresh.seedFromStudyFilter(['ALK'], true);
            assert.isFalse(fresh.seedPending);
            assert.deepEqual(fresh.anchor, {
                mode: 'gene',
                gene: 'ALK',
                side: '3p',
            });
            fresh.setAnchor(
                { mode: 'pair', key: 'ALK::EML4' },
                { source: 'auto' }
            );
            fresh.seedFromStudyFilter(['ALK'], true); // same gene: no-op
            assert.equal(fresh.anchor!.mode, 'pair');
        });

        it('0 or ≥2 genes do not seed', () => {
            store.seedFromStudyFilter(['ALK'], false);
            assert.isTrue(store.seedPending);
            store.seedFromStudyFilter([], true);
            assert.isFalse(store.seedPending);
            store.seedFromStudyFilter(['ALK'], false);
            assert.isTrue(store.seedPending);
            store.seedFromStudyFilter(['ALK', 'RET'], true);
            assert.isFalse(store.seedPending);
            assert.isFalse(store.hasAnchorSelection);
        });

        it('user pick blocks later seeds', () => {
            store.seedFromStudyFilter(['ALK'], false);
            assert.isTrue(store.seedPending);
            store.setAnchor({ mode: 'pair', key: 'ALK::EML4' });
            assert.isFalse(store.seedPending);
            store.seedFromStudyFilter(['ALK'], true);
            assert.isFalse(store.seedPending);
            assert.equal(store.anchor!.mode, 'pair');
        });

        it('auto pick does not block seeding', () => {
            store.setAnchor(
                { mode: 'pair', key: 'ALK::EML4' },
                { source: 'auto' }
            );
            store.seedFromStudyFilter(['ALK'], true);
            assert.equal(store.anchor!.mode, 'gene');
        });

        it('seed A → B (pending) → A clears the stale pending B', () => {
            const fresh = new FusionCohortStore();
            fresh.setStructuralVariants([alk('S1', 'EML4', 'ALK')] as any);
            fresh.seedFromStudyFilter(['ALK'], true);
            fresh.seedFromStudyFilter(['RET'], false);
            assert.isTrue(fresh.seedPending);
            fresh.seedFromStudyFilter(['ALK'], true);
            assert.isFalse(fresh.seedPending);
            assert.equal((fresh.anchor as any).gene, 'ALK');
        });

        describe('arriving transcripts (spec 5)', () => {
            const plusTx = (gene: string) =>
                ({
                    transcriptId: gene,
                    gene,
                    genomeBuild: 'GRCh38',
                    exons: [],
                    strand: '+',
                    txStart: 0,
                    txEnd: 1000,
                } as any);
            // gene1/gene2 symbol and position are given explicitly. Both genes on
            // the + strand with connectionType 3to5: the LOWER position is 5'.
            const ev = (
                sample: string,
                g1: [string, number],
                g2: [string, number]
            ) =>
                makeEvent({
                    id: `${sample}-${g1[0]}-${g2[0]}`,
                    tumorId: sample,
                    connectionType: '3to5',
                    gene1: {
                        ...makeEvent().gene1,
                        symbol: g1[0],
                        position: g1[1],
                    },
                    gene2: {
                        ...makeEvent().gene2!,
                        symbol: g2[0],
                        position: g2[1],
                    },
                });
            // S1-S3: ALK is gene1 at 5000, partner at 100 => raw says ALK 5',
            // resolver says ALK is 3'. S4: ALK gene1 at 100 => ALK 5' either way.
            const flipStore = (side: 'auto' | '5p') => {
                const fresh = new FusionCohortStore();
                fresh.setStructuralVariants([
                    ev('S1', ['ALK', 5000], ['EML4', 100]),
                    ev('S2', ['ALK', 5000], ['KIF5B', 100]),
                    ev('S3', ['ALK', 5000], ['EML4', 100]),
                    ev('S4', ['ALK', 100], ['PTPN3', 5000]),
                ] as any);
                fresh.setAnchor({ mode: 'gene', gene: 'ALK', side });
                return fresh;
            };
            const land = (fresh: FusionCohortStore) =>
                fresh.mergeTranscripts(
                    ['ALK', 'EML4', 'KIF5B', 'PTPN3'].map(g => [
                        `GRCh38|${g}|`,
                        plusTx(g),
                    ]) as any
                );
            const ids = (rows: { sampleId: string }[]) =>
                rows.map(r => r.sampleId).sort();

            it('auto side flips from the raw 5\u2032 call to the resolved 3\u2032 call', () => {
                const fresh = flipStore('auto');
                assert.isFalse(fresh.transcriptsReady);
                assert.equal((fresh.anchor as any).side, '5p');
                assert.deepEqual(ids(fresh.sideRows.kept), [
                    'S1',
                    'S2',
                    'S3',
                    'S4',
                ]);
                assert.equal(fresh.sideRows.oppositeCount, 0);

                land(fresh);
                assert.isTrue(fresh.transcriptsReady);
                assert.equal((fresh.anchor as any).side, '3p');
                assert.deepEqual(ids(fresh.anchorRows), ['S1', 'S2', 'S3']);
                assert.equal(fresh.sideRows.oppositeCount, 1);
                fresh.anchorRows.forEach(r =>
                    assert.equal(r.threePrimeSymbol, 'ALK')
                );
            });

            it('an explicit side does not change when transcripts land', () => {
                const fresh = flipStore('5p');
                assert.equal((fresh.anchor as any).side, '5p');
                assert.lengthOf(fresh.anchorRows, 4);
                land(fresh);
                assert.equal((fresh.anchor as any).side, '5p');
                // Rows are re-filtered by the resolved call; the side is not.
                assert.deepEqual(ids(fresh.anchorRows), ['S4']);
                assert.equal(fresh.sideRows.oppositeCount, 3);
            });

            it('requests transcripts for opposite-side rows too', () => {
                store.setAnchor({ mode: 'gene', gene: 'ALK', side: '3p' });
                // S3 (ALK 5', PTPN3 3') is opposite-side for a 3' anchor.
                assert.equal(store.sideRows.oppositeCount, 1);
                const symbols = store.transcriptRequests.map(r => r.symbol);
                assert.include(symbols, 'PTPN3');
                assert.include(symbols, 'ALK');
            });

            it('an orphaned selection requests its fallback gene and waits for it', () => {
                store.setStructuralVariants([
                    alk('S1', 'EML4', 'ALK'),
                    alk('S6', 'EML4', 'RET'),
                    alk('S7', 'KIF5B', 'RET'),
                ] as any);
                store.setAnchor({ mode: 'gene', gene: 'ALK', side: '3p' });
                store.setGenePartnerFilter(['RET']); // ALK is orphaned
                assert.equal((store.anchor as any).gene, 'RET');
                const symbols = store.transcriptRequests.map(r => r.symbol);
                assert.include(symbols, 'RET');
                assert.notInclude(symbols, 'ALK');
                assert.isFalse(store.transcriptsReady);
                store.mergeTranscripts([['GRCh38|RET|', plusTx('RET')]]);
                assert.isFalse(store.transcriptsReady); // partners outstanding
                store.markTranscriptsFailed(
                    store.outstandingTranscriptRequests.map(
                        r => `${r.build}|${r.symbol}|${r.transcriptId}`
                    )
                );
                assert.isTrue(store.transcriptsReady);
            });
        });
    });
});

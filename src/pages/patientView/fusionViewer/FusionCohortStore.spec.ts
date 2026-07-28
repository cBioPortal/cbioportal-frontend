import { assert } from 'chai';
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
            store.setAnchor({ mode: 'driver', key: 'TMPRSS2' });
            const rows = store.comparisonRows;
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

    describe('actions', () => {
        beforeEach(() => {
            store.setStructuralVariants([makeEvent({ id: 'e1' }) as any]);
        });

        it('setGenePartnerFilter updates filter', () => {
            store.setGenePartnerFilter(['EWSR1']);
            assert.deepEqual(store.filter.genePartners, ['EWSR1']);
        });

        it('toggleFusionPairKey adds key when not present', () => {
            store.toggleFusionPairKey('GENE_A::GENE_B');
            assert.include(store.filter.fusionPairKeys, 'GENE_A::GENE_B');
        });

        it('toggleFusionPairKey removes key when already present', () => {
            store.toggleFusionPairKey('GENE_A::GENE_B');
            store.toggleFusionPairKey('GENE_A::GENE_B');
            assert.notInclude(store.filter.fusionPairKeys, 'GENE_A::GENE_B');
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

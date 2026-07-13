import { assert } from 'chai';
import { autorun } from 'mobx';
import { FusionViewerStore } from './FusionViewerStore';
import { FusionEvent, TranscriptData } from './data/types';

// ---------------------------------------------------------------------------
// Mock the transcript service (async, so we control resolution)
// ---------------------------------------------------------------------------

const mockFetchTranscripts = jest.fn();

jest.mock('./data/genomeNexusTranscriptService', () => ({
    fetchTranscriptsForGeneWithFallback: (...args: any[]) =>
        mockFetchTranscripts(...args),
}));

jest.mock('./data/structuralVariantAdapter', () => ({
    convertStructuralVariantsToFusionEvents: jest.fn((svs: any[]) =>
        svs.map((sv: any) => sv as FusionEvent)
    ),
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

function makeTranscript(
    overrides: Partial<TranscriptData> = {}
): TranscriptData {
    return {
        transcriptId: 'ENST00000001',
        displayName: 'ENST00000001',
        gene: 'GENE_A',
        biotype: 'protein_coding',
        strand: '+' as const,
        txStart: 100,
        txEnd: 500,
        exons: [{ number: 1, start: 100, end: 200 }],
        isForteSelected: false,
        isCallerSelected: false,
        isCanonical: false,
        domains: [],
        utrs: [],
        ...overrides,
    };
}

function makeFusion(overrides: Partial<FusionEvent> = {}): FusionEvent {
    return {
        id: 'fusion_1',
        tumorId: 'SAMPLE_001',
        gene1: {
            symbol: 'ALK',
            chromosome: '2',
            position: 5000,
            selectedTranscriptId: 'ENST00000001',
            siteDescription: 'Exon 5',
        },
        gene2: {
            symbol: 'EML4',
            chromosome: '2',
            position: 8000,
            selectedTranscriptId: 'ENST00000002',
            siteDescription: 'Exon 6',
        },
        fusion: 'ALK::EML4',
        totalReadSupport: 15,
        callMethod: 'FUSION',
        frameCallMethod: 'In_frame',
        annotation: '',
        position: 'Exon 5 | Exon 6',
        significance: 'NA',
        note: '',
        connectionType: '',
        svIdiom: 'INTERGENIC_FUSION',
        frame: 'IN_FRAME',
        isRnaDerived: false,
        ...overrides,
    };
}

describe('FusionViewerStore', () => {
    let store: FusionViewerStore;
    let disposeAutorun: () => void;

    beforeEach(() => {
        jest.clearAllMocks();
        // Default: return empty arrays so selectFusion doesn't fail
        mockFetchTranscripts.mockResolvedValue([]);
        store = new FusionViewerStore();
        // Keep remoteData reactive (mirrors mobx-react observer in production)
        disposeAutorun = autorun(() => {
            void store.transcriptsLoading;
        });
    });

    afterEach(() => {
        disposeAutorun();
    });

    // -------------------------------------------------------------------
    // setStructuralVariants
    // -------------------------------------------------------------------
    describe('setStructuralVariants', () => {
        it('populates fusions array and auto-selects first fusion', () => {
            const f1 = makeFusion({ id: 'f1' });
            const f2 = makeFusion({ id: 'f2' });

            store.setStructuralVariants([f1, f2] as any);

            assert.equal(store.fusions.length, 2);
            assert.equal(store.selectedFusionId, 'f1');
        });

        it('does not select anything if fusions array is empty', () => {
            store.setStructuralVariants([] as any);

            assert.equal(store.fusions.length, 0);
            assert.equal(store.selectedFusionId, '');
        });
    });

    // -------------------------------------------------------------------
    // selectFusion
    // -------------------------------------------------------------------
    describe('selectFusion', () => {
        it('sets selectedFusionId and clears selections (the default is applied on transcript load)', () => {
            const f = makeFusion({ id: 'f1' });
            store.structuralVariants = [f] as any;

            store.selectFusion('f1');

            // No synchronous pre-seed: the origin-gated default is applied in
            // the transcript remote's onResult, not here.
            assert.equal(store.selectedFusionId, 'f1');
            assert.equal(store.selectedTranscript5pIds.size, 0);
            assert.equal(store.selectedTranscript3pIds.size, 0);
        });

        it('clears prior selections when switching fusions', () => {
            const f1 = makeFusion({ id: 'f1' });
            const f2 = makeFusion({ id: 'f2' });
            store.structuralVariants = [f1, f2] as any;

            store.selectFusion('f1');
            store.selectedTranscript5pIds.add('ENST_USER_PICK');
            assert.isTrue(store.selectedTranscript5pIds.has('ENST_USER_PICK'));

            store.selectFusion('f2');
            assert.equal(store.selectedFusionId, 'f2');
            assert.equal(store.selectedTranscript5pIds.size, 0);
        });

        it('does not populate 3p selections for single-gene fusions', () => {
            const f = makeFusion({ id: 'f1', gene2: null });
            store.structuralVariants = [f] as any;

            store.selectFusion('f1');

            assert.equal(store.selectedTranscript3pIds.size, 0);
        });

        it('is a no-op for non-existent fusion ID', () => {
            store.structuralVariants = [makeFusion({ id: 'f1' })] as any;
            store.selectFusion('f1');
            store.selectFusion('nonexistent');

            // selectedFusionId stays at previous value since nonexistent is ignored
            assert.equal(store.selectedFusionId, 'f1');
        });
    });

    // -------------------------------------------------------------------
    // toggleTranscript5p / toggleTranscript3p
    // -------------------------------------------------------------------
    describe('toggleTranscript5p', () => {
        it('adds a transcript ID when not present', () => {
            store.toggleTranscript5p('ENST00000001');

            assert.isTrue(store.selectedTranscript5pIds.has('ENST00000001'));
        });

        it('removes a transcript ID when present and not the last one', () => {
            store.selectedTranscript5pIds.add('ENST00000001');
            store.selectedTranscript5pIds.add('ENST00000002');

            store.toggleTranscript5p('ENST00000001');

            assert.isFalse(store.selectedTranscript5pIds.has('ENST00000001'));
            assert.isTrue(store.selectedTranscript5pIds.has('ENST00000002'));
        });

        it('does not remove the last transcript ID', () => {
            store.selectedTranscript5pIds.add('ENST00000001');

            store.toggleTranscript5p('ENST00000001');

            assert.isTrue(store.selectedTranscript5pIds.has('ENST00000001'));
            assert.equal(store.selectedTranscript5pIds.size, 1);
        });

        it('unchecking the active driver falls back to a still-SELECTED transcript, not the global default', async () => {
            const a = makeTranscript({ transcriptId: 'ENST_A' });
            const b = makeTranscript({ transcriptId: 'ENST_B' });
            // C is the origin default (caller-selected) but the user won't tick it.
            const c = makeTranscript({
                transcriptId: 'ENST_C',
                isForteSelected: true,
                isCallerSelected: true,
            });
            mockFetchTranscripts.mockResolvedValue([a, b, c]);
            store.setStructuralVariants([
                makeFusion({ id: 'f1', isRnaDerived: true, gene2: null }),
            ] as any);
            await new Promise(r => setTimeout(r, 50));

            // User multi-selects A (active) and B — NOT the caller default C.
            store.selectedTranscript5pIds.clear();
            store.selectedTranscript5pIds.add('ENST_A');
            store.selectedTranscript5pIds.add('ENST_B');
            store.setActiveTranscript5p('ENST_A');

            store.toggleTranscript5p('ENST_A'); // uncheck the active driver

            // Must fall back to B (still selected), NOT C (the global default).
            assert.equal(store.activeTranscript5pId, 'ENST_B');
            assert.isFalse(store.selectedTranscript5pIds.has('ENST_A'));
        });
    });

    describe('toggleTranscript3p', () => {
        it('adds a transcript ID when not present', () => {
            store.toggleTranscript3p('ENST00000002');

            assert.isTrue(store.selectedTranscript3pIds.has('ENST00000002'));
        });

        it('does not remove the last transcript ID', () => {
            store.selectedTranscript3pIds.add('ENST00000002');

            store.toggleTranscript3p('ENST00000002');

            assert.isTrue(store.selectedTranscript3pIds.has('ENST00000002'));
        });
    });

    // -------------------------------------------------------------------
    // Computed getters
    // -------------------------------------------------------------------
    describe('computed getters', () => {
        it('selectedFusion returns the fusion matching selectedFusionId', () => {
            const f = makeFusion({ id: 'f1' });
            store.structuralVariants = [f] as any;
            store.selectedFusionId = 'f1';

            assert.deepEqual(store.selectedFusion, f);
        });

        it('selectedFusion returns undefined for no match', () => {
            store.structuralVariants = [makeFusion({ id: 'f1' })] as any;
            store.selectedFusionId = 'nonexistent';

            assert.isUndefined(store.selectedFusion);
        });

        it('selectedTranscript5pId returns first ID from the set', () => {
            store.selectedTranscript5pIds.add('ENST_A');
            store.selectedTranscript5pIds.add('ENST_B');

            assert.equal(store.selectedTranscript5pId, 'ENST_A');
        });

        it('selectedTranscript5pId returns empty string when set is empty', () => {
            assert.equal(store.selectedTranscript5pId, '');
        });

        it('selectedTranscript5p finds transcript in gene1Transcripts', async () => {
            const t1 = makeTranscript({ transcriptId: 'ENST_X' });
            const t2 = makeTranscript({ transcriptId: 'ENST_Y' });
            mockFetchTranscripts.mockResolvedValue([t1, t2]);

            store.setStructuralVariants([makeFusion({ id: 'f1' })] as any);
            await new Promise(r => setTimeout(r, 50));

            store.selectedTranscript5pIds.clear();
            store.selectedTranscript5pIds.add('ENST_Y');
            assert.equal(store.selectedTranscript5p!.transcriptId, 'ENST_Y');
        });

        it('gene1Transcripts returns result from remoteData', async () => {
            const t = makeTranscript({ transcriptId: 'ENST_X' });
            mockFetchTranscripts.mockResolvedValue([t]);

            const f = makeFusion({ id: 'f1' });
            store.setStructuralVariants([f] as any);
            await new Promise(r => setTimeout(r, 50));

            assert.isTrue(
                store.gene1Transcripts.some(tr => tr.transcriptId === 'ENST_X')
            );
        });

        it('gene1Transcripts defaults to empty array when no fusion selected', () => {
            assert.deepEqual(store.gene1Transcripts, []);
        });

        it('forteTranscript5p returns the FORTE-selected transcript', async () => {
            const t1 = makeTranscript({
                transcriptId: 'ENST_1',
                isForteSelected: false,
            });
            const t2 = makeTranscript({
                transcriptId: 'ENST_2',
                isForteSelected: true,
            });
            mockFetchTranscripts.mockResolvedValue([t1, t2]);

            const f = makeFusion({ id: 'f1' });
            store.setStructuralVariants([f] as any);
            await new Promise(r => setTimeout(r, 50));

            assert.equal(store.forteTranscript5p!.transcriptId, 'ENST_2');
        });

        it('forteTranscript5p returns undefined when none is FORTE-selected', async () => {
            mockFetchTranscripts.mockResolvedValue([
                makeTranscript({ isForteSelected: false }),
            ]);

            const f = makeFusion({ id: 'f1' });
            store.setStructuralVariants([f] as any);
            await new Promise(r => setTimeout(r, 50));

            assert.isUndefined(store.forteTranscript5p);
        });
    });

    // -------------------------------------------------------------------
    // remoteData async behavior
    // -------------------------------------------------------------------
    describe('remoteData transcript fetching', () => {
        it('fetches transcripts when a fusion is selected', async () => {
            const transcript = makeTranscript({ isForteSelected: true });
            mockFetchTranscripts.mockResolvedValue([transcript]);

            const f = makeFusion({ id: 'f1' });
            store.setStructuralVariants([f] as any);
            await new Promise(r => setTimeout(r, 50));

            assert.isTrue(mockFetchTranscripts.mock.calls.length > 0);
            assert.isFalse(store.transcriptsLoading);
        });

        it('auto-selects FORTE transcript when selectedTranscript5pIds is empty', async () => {
            const forteT = makeTranscript({
                transcriptId: 'ENST_FORTE',
                isForteSelected: true,
            });
            mockFetchTranscripts.mockResolvedValue([forteT]);

            const f = makeFusion({
                id: 'f1',
                gene1: {
                    symbol: 'ALK',
                    chromosome: '2',
                    position: 5000,
                    selectedTranscriptId: '', // empty — so nothing pre-populated
                    siteDescription: '',
                },
                gene2: null,
            });
            store.setStructuralVariants([f] as any);
            await new Promise(r => setTimeout(r, 50));

            assert.isTrue(store.selectedTranscript5pIds.has('ENST_FORTE'));
        });

        it('returns correct transcripts after switching fusions', async () => {
            const f1 = makeFusion({ id: 'f1' });
            const f2 = makeFusion({ id: 'f2' });

            const transcript1 = makeTranscript({
                transcriptId: 'FROM_F1',
                isForteSelected: true,
            });
            const transcript2 = makeTranscript({
                transcriptId: 'FROM_F2',
                isForteSelected: true,
            });

            mockFetchTranscripts.mockResolvedValue([transcript1]);
            store.setStructuralVariants([f1, f2] as any);
            await new Promise(r => setTimeout(r, 50));

            assert.equal(store.gene1Transcripts[0]?.transcriptId, 'FROM_F1');

            mockFetchTranscripts.mockResolvedValue([transcript2]);
            store.selectFusion('f2');
            await new Promise(r => setTimeout(r, 50));

            assert.equal(store.gene1Transcripts[0]?.transcriptId, 'FROM_F2');
        });
    });

    // -------------------------------------------------------------------
    // genome build derivation
    // -------------------------------------------------------------------
    describe('genome build from referenceGenome', () => {
        it('derives GRCh37 from hg19', () => {
            store.setStructuralVariants([] as any, 'hg19');

            assert.equal(store.genomeBuild, 'GRCh37');
        });

        it('derives GRCh38 from hg38', () => {
            store.setStructuralVariants([] as any, 'hg38');

            assert.equal(store.genomeBuild, 'GRCh38');
        });

        it('defaults to GRCh38 when referenceGenome is omitted', () => {
            store.setStructuralVariants([] as any);

            assert.equal(store.genomeBuild, 'GRCh38');
        });
    });

    // -------------------------------------------------------------------
    // transcript ID pruning in onResult
    // -------------------------------------------------------------------
    describe('onResult transcript pruning', () => {
        it('prunes invalid pre-populated transcript IDs and falls back to FORTE', async () => {
            const forteT = makeTranscript({
                transcriptId: 'ENST_FORTE',
                isForteSelected: true,
            });
            mockFetchTranscripts.mockResolvedValue([forteT]);

            // Fusion has a transcript ID that Genome Nexus won't return
            const f = makeFusion({
                id: 'f1',
                gene1: {
                    symbol: 'ALK',
                    chromosome: '2',
                    position: 5000,
                    selectedTranscriptId: 'ENST_INVALID',
                    siteDescription: '',
                },
                gene2: null,
            });
            store.setStructuralVariants([f] as any);
            await new Promise(r => setTimeout(r, 50));

            // Invalid ID should be pruned, FORTE should be selected
            assert.isFalse(store.selectedTranscript5pIds.has('ENST_INVALID'));
            assert.isTrue(store.selectedTranscript5pIds.has('ENST_FORTE'));
        });

        it('RNA-derived fusion: ticks the caller-selected transcript by default (over canonical)', async () => {
            const canonicalT = makeTranscript({
                transcriptId: 'ENST_CANONICAL',
                isCanonical: true,
            });
            const svT = makeTranscript({
                transcriptId: 'ENST_SV',
                isForteSelected: true,
                isCallerSelected: true,
            });
            mockFetchTranscripts.mockResolvedValue([svT, canonicalT]);

            const f = makeFusion({
                id: 'f1',
                isRnaDerived: true,
                gene1: {
                    symbol: 'ALK',
                    chromosome: '2',
                    position: 5000,
                    selectedTranscriptId: 'ENST_SV',
                    siteDescription: '',
                },
                gene2: null,
            });
            store.setStructuralVariants([f] as any);
            await new Promise(r => setTimeout(r, 50));

            assert.isTrue(store.selectedTranscript5pIds.has('ENST_SV'));
            assert.isFalse(store.selectedTranscript5pIds.has('ENST_CANONICAL'));
            assert.equal(store.selectedTranscript5pIds.size, 1);
            // The rendered (active) transcript must match the ticked default.
            assert.equal(store.activeTranscript5pId, 'ENST_SV');
        });

        it('DNA SV: ticks the MSK canonical transcript by default (ignores the caller transcript)', async () => {
            const canonicalT = makeTranscript({
                transcriptId: 'ENST_CANONICAL',
                isCanonical: true,
            });
            const svT = makeTranscript({
                transcriptId: 'ENST_SV',
                isForteSelected: true,
                isCallerSelected: true,
            });
            mockFetchTranscripts.mockResolvedValue([svT, canonicalT]);

            const f = makeFusion({
                id: 'f1',
                isRnaDerived: false,
                gene1: {
                    symbol: 'ALK',
                    chromosome: '2',
                    position: 5000,
                    selectedTranscriptId: 'ENST_SV',
                    siteDescription: '',
                },
                gene2: null,
            });
            store.setStructuralVariants([f] as any);
            await new Promise(r => setTimeout(r, 50));

            assert.isTrue(store.selectedTranscript5pIds.has('ENST_CANONICAL'));
            assert.isFalse(store.selectedTranscript5pIds.has('ENST_SV'));
            assert.equal(store.selectedTranscript5pIds.size, 1);
            // The rendered (active) transcript must match the ticked default —
            // for a DNA SV that is canonical, not the caller-matched transcript.
            assert.equal(store.activeTranscript5pId, 'ENST_CANONICAL');
        });
    });

    // -------------------------------------------------------------------
    // active transcript observables & setters
    // -------------------------------------------------------------------
    describe('active transcript state', () => {
        it('defaults activeTranscript5pId and activeTranscript3pId to empty string', () => {
            assert.equal(store.activeTranscript5pId, '');
            assert.equal(store.activeTranscript3pId, '');
        });

        it('setActiveTranscript5p updates activeTranscript5pId', () => {
            store.setActiveTranscript5p('ENST_X');
            assert.equal(store.activeTranscript5pId, 'ENST_X');
        });

        it('setActiveTranscript3p updates activeTranscript3pId', () => {
            store.setActiveTranscript3p('ENST_Y');
            assert.equal(store.activeTranscript3pId, 'ENST_Y');
        });

        it('activeTranscript5p computes from gene1Transcripts by activeTranscript5pId', async () => {
            const t1 = makeTranscript({ transcriptId: 'ENST_A' });
            const t2 = makeTranscript({ transcriptId: 'ENST_B' });
            mockFetchTranscripts.mockResolvedValue([t1, t2]);

            store.setStructuralVariants([makeFusion({ id: 'f1' })] as any);
            await new Promise(r => setTimeout(r, 50));

            store.setActiveTranscript5p('ENST_B');
            assert.equal(store.activeTranscript5p!.transcriptId, 'ENST_B');
        });

        it('activeTranscript5p returns undefined when id is empty', () => {
            assert.isUndefined(store.activeTranscript5p);
        });

        it('selectFusion resets activeTranscript5pId and activeTranscript3pId to empty', () => {
            const f = makeFusion({ id: 'f1' });
            store.structuralVariants = [f] as any;
            store.activeTranscript5pId = 'ENST_STALE_5';
            store.activeTranscript3pId = 'ENST_STALE_3';

            store.selectFusion('f1');

            assert.equal(store.activeTranscript5pId, '');
            assert.equal(store.activeTranscript3pId, '');
        });

        it('setStructuralVariants clears active IDs along with selections', () => {
            store.activeTranscript5pId = 'ENST_STALE';
            store.activeTranscript3pId = 'ENST_STALE_3';

            store.setStructuralVariants([] as any);

            assert.equal(store.activeTranscript5pId, '');
            assert.equal(store.activeTranscript3pId, '');
        });

        it('gene1TranscriptsRemote.onResult sets activeTranscript5pId to FORTE when invalid', async () => {
            const forteT = makeTranscript({
                transcriptId: 'ENST_FORTE',
                isForteSelected: true,
            });
            const otherT = makeTranscript({
                transcriptId: 'ENST_OTHER',
                isForteSelected: false,
            });
            mockFetchTranscripts.mockResolvedValue([otherT, forteT]);

            store.setStructuralVariants([makeFusion({ id: 'f1' })] as any);
            await new Promise(r => setTimeout(r, 50));

            assert.equal(store.activeTranscript5pId, 'ENST_FORTE');
        });

        it('gene1TranscriptsRemote.onResult falls back to first transcript when no FORTE', async () => {
            const t1 = makeTranscript({
                transcriptId: 'ENST_FIRST',
                isForteSelected: false,
            });
            const t2 = makeTranscript({
                transcriptId: 'ENST_SECOND',
                isForteSelected: false,
            });
            mockFetchTranscripts.mockResolvedValue([t1, t2]);

            store.setStructuralVariants([makeFusion({ id: 'f1' })] as any);
            await new Promise(r => setTimeout(r, 50));

            assert.equal(store.activeTranscript5pId, 'ENST_FIRST');
        });

        it('gene1TranscriptsRemote.onResult backfills active ID after switching fusions', async () => {
            const f1Forte = makeTranscript({
                transcriptId: 'ENST_F1_FORTE',
                isForteSelected: true,
            });
            const f2Forte = makeTranscript({
                transcriptId: 'ENST_F2_FORTE',
                isForteSelected: true,
            });
            mockFetchTranscripts.mockResolvedValueOnce([f1Forte]);

            const f1 = makeFusion({ id: 'f1' });
            const f2 = makeFusion({ id: 'f2' });
            store.setStructuralVariants([f1, f2] as any);
            await new Promise(r => setTimeout(r, 50));

            assert.equal(store.activeTranscript5pId, 'ENST_F1_FORTE');

            mockFetchTranscripts.mockResolvedValueOnce([f2Forte]);
            store.selectFusion('f2');
            await new Promise(r => setTimeout(r, 50));

            assert.equal(store.activeTranscript5pId, 'ENST_F2_FORTE');
        });

        it('gene2TranscriptsRemote.onResult sets activeTranscript3pId to FORTE when invalid', async () => {
            const forte5p = makeTranscript({
                transcriptId: 'ENST_5P',
                isForteSelected: true,
            });
            const forte3p = makeTranscript({
                transcriptId: 'ENST_3P_FORTE',
                isForteSelected: true,
            });
            mockFetchTranscripts
                .mockResolvedValueOnce([forte5p])
                .mockResolvedValueOnce([forte3p]);

            store.setStructuralVariants([makeFusion({ id: 'f1' })] as any);
            await new Promise(r => setTimeout(r, 50));

            assert.equal(store.activeTranscript3pId, 'ENST_3P_FORTE');
        });

        it('toggleTranscript5p falls back activeTranscript5pId when un-checking the active one', async () => {
            const forteT = makeTranscript({
                transcriptId: 'ENST_FORTE',
                isForteSelected: true,
            });
            const otherT = makeTranscript({
                transcriptId: 'ENST_OTHER',
                isForteSelected: false,
            });
            mockFetchTranscripts.mockResolvedValue([forteT, otherT]);

            store.setStructuralVariants([makeFusion({ id: 'f1' })] as any);
            await new Promise(r => setTimeout(r, 50));

            store.selectedTranscript5pIds.add('ENST_OTHER');
            store.setActiveTranscript5p('ENST_OTHER');

            // Un-check the currently-active transcript
            store.toggleTranscript5p('ENST_OTHER');

            assert.isFalse(store.selectedTranscript5pIds.has('ENST_OTHER'));
            assert.equal(store.activeTranscript5pId, 'ENST_FORTE');
        });

        it('toggleTranscript3p falls back activeTranscript3pId when un-checking the active one', async () => {
            const forte5p = makeTranscript({
                transcriptId: 'ENST_5P',
                isForteSelected: true,
            });
            const forte3p = makeTranscript({
                transcriptId: 'ENST_3P_FORTE',
                isForteSelected: true,
            });
            const other3p = makeTranscript({
                transcriptId: 'ENST_3P_OTHER',
                isForteSelected: false,
            });
            mockFetchTranscripts
                .mockResolvedValueOnce([forte5p])
                .mockResolvedValueOnce([forte3p, other3p]);

            store.setStructuralVariants([makeFusion({ id: 'f1' })] as any);
            await new Promise(r => setTimeout(r, 50));

            store.selectedTranscript3pIds.add('ENST_3P_OTHER');
            store.setActiveTranscript3p('ENST_3P_OTHER');

            store.toggleTranscript3p('ENST_3P_OTHER');

            assert.equal(store.activeTranscript3pId, 'ENST_3P_FORTE');
        });
    });

    // -------------------------------------------------------------------
    // showPromoter toggle
    // -------------------------------------------------------------------
    describe('showPromoter toggle', () => {
        it('defaults to true', () => {
            const store = new FusionViewerStore();
            assert.equal(store.showPromoter, true);
        });
        it('flips state on toggleShowPromoter()', () => {
            const store = new FusionViewerStore();
            store.toggleShowPromoter();
            assert.equal(store.showPromoter, false);
            store.toggleShowPromoter();
            assert.equal(store.showPromoter, true);
        });
    });
});

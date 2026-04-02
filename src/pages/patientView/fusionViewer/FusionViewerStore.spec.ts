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
        domains: [],
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
            strand: '+',
            selectedTranscriptId: 'ENST00000001',
            siteDescription: 'Exon 5',
        },
        gene2: {
            symbol: 'EML4',
            chromosome: '2',
            position: 8000,
            strand: '+',
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
        it('sets selectedFusionId and pre-populates transcript selections', () => {
            const f = makeFusion({ id: 'f1' });
            store.structuralVariants = [f] as any;

            store.selectFusion('f1');

            assert.equal(store.selectedFusionId, 'f1');
            assert.isTrue(store.selectedTranscript5pIds.has('ENST00000001'));
            assert.isTrue(store.selectedTranscript3pIds.has('ENST00000002'));
        });

        it('clears prior selections when switching fusions', () => {
            const f1 = makeFusion({
                id: 'f1',
                gene1: {
                    symbol: 'ALK',
                    chromosome: '2',
                    position: 5000,
                    strand: '+',
                    selectedTranscriptId: 'ENST00000001',
                    siteDescription: '',
                },
            });
            const f2 = makeFusion({
                id: 'f2',
                gene1: {
                    symbol: 'ROS1',
                    chromosome: '6',
                    position: 9000,
                    strand: '+',
                    selectedTranscriptId: 'ENST00000003',
                    siteDescription: '',
                },
            });
            store.structuralVariants = [f1, f2] as any;

            store.selectFusion('f1');
            assert.isTrue(store.selectedTranscript5pIds.has('ENST00000001'));

            store.selectFusion('f2');
            assert.isFalse(store.selectedTranscript5pIds.has('ENST00000001'));
            assert.isTrue(store.selectedTranscript5pIds.has('ENST00000003'));
        });

        it('does not populate 3p selections for single-gene fusions', () => {
            const f = makeFusion({ id: 'f1', gene2: null });
            store.structuralVariants = [f] as any;

            store.selectFusion('f1');

            assert.equal(store.selectedTranscript3pIds.size, 0);
        });

        it('is a no-op for non-existent fusion ID', () => {
            store.structuralVariants = [makeFusion({ id: 'f1' })] as any;
            store.selectFusion('nonexistent');

            assert.equal(store.selectedFusionId, 'nonexistent');
            assert.equal(store.selectedTranscript5pIds.size, 0);
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
                    strand: '+',
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
    // setGenomeBuild
    // -------------------------------------------------------------------
    describe('setGenomeBuild', () => {
        it('updates genomeBuild observable', () => {
            store.setGenomeBuild('GRCh37');

            assert.equal(store.genomeBuild, 'GRCh37');
        });

        it('is a no-op when setting the same build', () => {
            store.setGenomeBuild('GRCh38');
            mockFetchTranscripts.mockClear();

            store.setGenomeBuild('GRCh38');

            // genomeBuild unchanged, so remoteData won't re-invoke
            assert.equal(store.genomeBuild, 'GRCh38');
        });
    });
});

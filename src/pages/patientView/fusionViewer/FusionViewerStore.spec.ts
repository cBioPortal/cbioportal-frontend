import { assert } from 'chai';
import { FusionViewerStore } from './FusionViewerStore';
import { FusionEvent, TranscriptData } from './data/types';

// ---------------------------------------------------------------------------
// Mock the transcript service (async, so we control resolution)
// ---------------------------------------------------------------------------

const mockFetchTranscripts = jest.fn();

jest.mock('./data/ensemblTranscriptService', () => ({
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

    beforeEach(() => {
        jest.clearAllMocks();
        // Default: return empty arrays so selectFusion doesn't fail
        mockFetchTranscripts.mockResolvedValue([]);
        store = new FusionViewerStore();
    });

    // -------------------------------------------------------------------
    // loadFromStructuralVariants
    // -------------------------------------------------------------------
    describe('loadFromStructuralVariants', () => {
        it('populates fusions array and auto-selects first fusion', () => {
            const f1 = makeFusion({ id: 'f1' });
            const f2 = makeFusion({ id: 'f2' });

            store.loadFromStructuralVariants([f1, f2] as any);

            assert.equal(store.fusions.length, 2);
            assert.equal(store.selectedFusionId, 'f1');
        });

        it('does not select anything if fusions array is empty', () => {
            store.loadFromStructuralVariants([] as any);

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
            store.fusions = [f];

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
            store.fusions = [f1, f2];

            store.selectFusion('f1');
            assert.isTrue(store.selectedTranscript5pIds.has('ENST00000001'));

            store.selectFusion('f2');
            assert.isFalse(store.selectedTranscript5pIds.has('ENST00000001'));
            assert.isTrue(store.selectedTranscript5pIds.has('ENST00000003'));
        });

        it('does not populate 3p selections for single-gene fusions', () => {
            const f = makeFusion({ id: 'f1', gene2: null });
            store.fusions = [f];

            store.selectFusion('f1');

            assert.equal(store.selectedTranscript3pIds.size, 0);
        });

        it('triggers transcript fetch', () => {
            const f = makeFusion({ id: 'f1' });
            store.fusions = [f];

            store.selectFusion('f1');

            assert.isTrue(mockFetchTranscripts.mock.calls.length > 0);
        });

        it('is a no-op for non-existent fusion ID', () => {
            store.fusions = [makeFusion({ id: 'f1' })];
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
            store.fusions = [f];
            store.selectedFusionId = 'f1';

            assert.deepEqual(store.selectedFusion, f);
        });

        it('selectedFusion returns undefined for no match', () => {
            store.fusions = [makeFusion({ id: 'f1' })];
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

        it('selectedTranscript5p finds transcript in gene1Transcripts', () => {
            const t = makeTranscript({ transcriptId: 'ENST_X' });
            store.asyncGene1Transcripts = [t];
            store.selectedTranscript5pIds.add('ENST_X');

            assert.equal(store.selectedTranscript5p!.transcriptId, 'ENST_X');
        });

        it('allSelectedTranscripts5p returns all matching transcripts', () => {
            const t1 = makeTranscript({ transcriptId: 'ENST_1' });
            const t2 = makeTranscript({ transcriptId: 'ENST_2' });
            const t3 = makeTranscript({ transcriptId: 'ENST_3' });
            store.asyncGene1Transcripts = [t1, t2, t3];
            store.selectedTranscript5pIds.add('ENST_1');
            store.selectedTranscript5pIds.add('ENST_3');

            const selected = store.allSelectedTranscripts5p;
            assert.equal(selected.length, 2);
            assert.equal(selected[0].transcriptId, 'ENST_1');
            assert.equal(selected[1].transcriptId, 'ENST_3');
        });

        it('forteTranscript5p returns the FORTE-selected transcript', () => {
            const t1 = makeTranscript({
                transcriptId: 'ENST_1',
                isForteSelected: false,
            });
            const t2 = makeTranscript({
                transcriptId: 'ENST_2',
                isForteSelected: true,
            });
            store.asyncGene1Transcripts = [t1, t2];

            assert.equal(store.forteTranscript5p!.transcriptId, 'ENST_2');
        });

        it('forteTranscript5p returns undefined when none is FORTE-selected', () => {
            store.asyncGene1Transcripts = [
                makeTranscript({ isForteSelected: false }),
            ];

            assert.isUndefined(store.forteTranscript5p);
        });
    });

    // -------------------------------------------------------------------
    // Race condition guard (_fetchVersion)
    // -------------------------------------------------------------------
    describe('race condition guard', () => {
        it('discards stale async responses when a newer fetch is in flight', async () => {
            const f1 = makeFusion({ id: 'f1' });
            const f2 = makeFusion({ id: 'f2' });
            store.fusions = [f1, f2];

            // Create two deferred promises to control resolution order
            let resolveFirst: (v: TranscriptData[]) => void;
            let resolveSecond: (v: TranscriptData[]) => void;

            const firstPromise = new Promise<TranscriptData[]>(r => {
                resolveFirst = r;
            });
            const secondPromise = new Promise<TranscriptData[]>(r => {
                resolveSecond = r;
            });

            let callCount = 0;
            mockFetchTranscripts.mockImplementation(() => {
                callCount++;
                if (callCount <= 2) return firstPromise; // calls 1-2: gene1 & gene2 of f1
                return secondPromise; // calls 3-4: gene1 & gene2 of f2
            });

            // Start first fetch
            store.selectFusion('f1');
            // Immediately switch to second fusion (supersedes first)
            store.selectFusion('f2');

            const staleTranscript = makeTranscript({
                transcriptId: 'STALE',
                isForteSelected: true,
            });
            const freshTranscript = makeTranscript({
                transcriptId: 'FRESH',
                isForteSelected: true,
            });

            // Resolve the SECOND (newer) fetch first
            resolveSecond!([freshTranscript]);
            await new Promise(r => setTimeout(r, 10));

            assert.equal(
                store.asyncGene1Transcripts[0]?.transcriptId,
                'FRESH'
            );

            // Now resolve the FIRST (stale) fetch — should be discarded
            resolveFirst!([staleTranscript]);
            await new Promise(r => setTimeout(r, 10));

            // Should still be FRESH, not overwritten by stale response
            assert.equal(
                store.asyncGene1Transcripts[0]?.transcriptId,
                'FRESH'
            );
        });

        it('sets transcriptsLoading to false after fetch completes', async () => {
            const f = makeFusion({ id: 'f1' });
            store.fusions = [f];

            const transcript = makeTranscript({ isForteSelected: true });
            mockFetchTranscripts.mockResolvedValue([transcript]);

            store.selectFusion('f1');
            // Wait for async to settle
            await new Promise(r => setTimeout(r, 10));

            assert.isFalse(store.transcriptsLoading);
        });

        it('auto-selects FORTE transcript when selectedTranscript5pIds becomes empty', async () => {
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
            store.fusions = [f];

            const forteT = makeTranscript({
                transcriptId: 'ENST_FORTE',
                isForteSelected: true,
            });
            mockFetchTranscripts.mockResolvedValue([forteT]);

            store.selectFusion('f1');
            await new Promise(r => setTimeout(r, 10));

            assert.isTrue(
                store.selectedTranscript5pIds.has('ENST_FORTE')
            );
        });
    });

    // -------------------------------------------------------------------
    // setGenomeBuild
    // -------------------------------------------------------------------
    describe('setGenomeBuild', () => {
        it('updates genomeBuild and re-fetches when there is a selected fusion', () => {
            const f = makeFusion({ id: 'f1' });
            store.fusions = [f];
            store.selectedFusionId = 'f1';

            mockFetchTranscripts.mockClear();
            store.setGenomeBuild('GRCh37');

            assert.equal(store.genomeBuild, 'GRCh37');
            assert.isTrue(mockFetchTranscripts.mock.calls.length > 0);
        });

        it('is a no-op when setting the same build', () => {
            store.setGenomeBuild('GRCh38');
            mockFetchTranscripts.mockClear();

            store.setGenomeBuild('GRCh38');

            assert.equal(mockFetchTranscripts.mock.calls.length, 0);
        });
    });
});

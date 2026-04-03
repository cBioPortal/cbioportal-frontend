import { assert } from 'chai';

// ---------------------------------------------------------------------------
// Mock Genome Nexus client and config BEFORE importing the module under test
// ---------------------------------------------------------------------------

const mockFetchTranscripts = jest.fn();
const mockFetchCanonical = jest.fn();
const mockFetchPfam = jest.fn();

jest.mock('genome-nexus-ts-api-client', () => ({
    GenomeNexusAPI: jest.fn().mockImplementation(() => ({
        fetchEnsemblTranscriptsGET: mockFetchTranscripts,
        fetchCanonicalEnsemblTranscriptByHugoSymbolGET: mockFetchCanonical,
        fetchPfamDomainsByPfamAccessionPOST: mockFetchPfam,
    })),
}));

jest.mock('config/config', () => ({
    getServerConfig: () => ({
        genomenexus_url_grch38: 'https://grch38.genomenexus.org',
        genomenexus_url: 'https://v1.genomenexus.org',
    }),
}));

import {
    fetchTranscriptsFromEnsembl,
    fetchTranscriptsForGeneWithFallback,
} from './genomeNexusTranscriptService';

// ---------------------------------------------------------------------------
// Test data builders
// ---------------------------------------------------------------------------

function makeGNTranscript(overrides: Record<string, any> = {}) {
    return {
        transcriptId: 'ENST00000001.4',
        hugoSymbols: ['TEST_GENE'],
        proteinLength: 500,
        exons: [
            {
                rank: 2,
                exonStart: 200,
                exonEnd: 400,
                exonId: 'ENSE002',
                strand: 1,
            },
            {
                rank: 1,
                exonStart: 100,
                exonEnd: 150,
                exonId: 'ENSE001',
                strand: 1,
            },
        ],
        pfamDomains: [],
        ...overrides,
    };
}

// Use unique gene names per test to avoid module-level transcriptCache collisions.
let geneCounter = 0;
function uniqueGene(): string {
    return `TEST_GENE_${++geneCounter}`;
}

describe('genomeNexusTranscriptService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // -------------------------------------------------------------------
    // fetchTranscriptsFromEnsembl
    // -------------------------------------------------------------------
    describe('fetchTranscriptsFromEnsembl', () => {
        it('maps Genome Nexus transcripts to TranscriptData[]', async () => {
            const gene = uniqueGene();
            mockFetchTranscripts.mockResolvedValue([makeGNTranscript()]);
            mockFetchCanonical.mockResolvedValue(null);
            mockFetchPfam.mockResolvedValue([]);

            const result = await fetchTranscriptsFromEnsembl(gene, 'GRCh38');

            assert.equal(result.length, 1);
            const t = result[0];
            assert.equal(t.transcriptId, 'ENST00000001');
            assert.equal(t.gene, 'TEST_GENE');
            assert.equal(t.biotype, 'protein_coding');
            assert.equal(t.strand, '+');
            assert.equal(t.proteinLength, 500);
        });

        it('sorts exons by rank', async () => {
            const gene = uniqueGene();
            mockFetchTranscripts.mockResolvedValue([makeGNTranscript()]);
            mockFetchCanonical.mockResolvedValue(null);

            const result = await fetchTranscriptsFromEnsembl(gene, 'GRCh38');

            assert.equal(result[0].exons[0].number, 1);
            assert.equal(result[0].exons[1].number, 2);
            assert.equal(result[0].exons[0].start, 100);
        });

        it('computes txStart/txEnd from exon boundaries', async () => {
            const gene = uniqueGene();
            mockFetchTranscripts.mockResolvedValue([makeGNTranscript()]);
            mockFetchCanonical.mockResolvedValue(null);

            const result = await fetchTranscriptsFromEnsembl(gene, 'GRCh38');

            assert.equal(result[0].txStart, 100);
            assert.equal(result[0].txEnd, 400);
        });

        it('detects minus strand from exon strand -1', async () => {
            const gene = uniqueGene();
            const minusStrandTranscript = makeGNTranscript({
                exons: [
                    {
                        rank: 1,
                        exonStart: 100,
                        exonEnd: 200,
                        exonId: 'E1',
                        strand: -1,
                    },
                ],
            });
            mockFetchTranscripts.mockResolvedValue([minusStrandTranscript]);
            mockFetchCanonical.mockResolvedValue(null);

            const result = await fetchTranscriptsFromEnsembl(gene, 'GRCh38');

            assert.equal(result[0].strand, '-');
        });

        it('tags the canonical transcript with "(canonical)" in displayName', async () => {
            const gene = uniqueGene();
            const transcript = makeGNTranscript({
                transcriptId: 'ENST00000555.2',
            });
            mockFetchTranscripts.mockResolvedValue([transcript]);
            mockFetchCanonical.mockResolvedValue({
                transcriptId: 'ENST00000555.2',
            });

            const result = await fetchTranscriptsFromEnsembl(gene, 'GRCh38');

            assert.include(result[0].displayName, '(canonical)');
        });

        it('resolves PFAM domain names', async () => {
            const gene = uniqueGene();
            const transcript = makeGNTranscript({
                pfamDomains: [
                    {
                        pfamDomainId: 'PF00069',
                        pfamDomainStart: 10,
                        pfamDomainEnd: 200,
                    },
                ],
            });
            mockFetchTranscripts.mockResolvedValue([transcript]);
            mockFetchCanonical.mockResolvedValue(null);
            mockFetchPfam.mockResolvedValue([
                { pfamAccession: 'PF00069', name: 'Protein kinase' },
            ]);

            const result = await fetchTranscriptsFromEnsembl(gene, 'GRCh38');

            assert.equal(result[0].domains.length, 1);
            assert.equal(result[0].domains[0].name, 'Protein kinase');
            assert.equal(result[0].domains[0].pfamId, 'PF00069');
        });

        it('returns empty array when no transcripts found', async () => {
            const gene = uniqueGene();
            mockFetchTranscripts.mockResolvedValue([]);
            mockFetchCanonical.mockResolvedValue(null);

            const result = await fetchTranscriptsFromEnsembl(gene, 'GRCh38');

            assert.deepEqual(result, []);
        });

        it('returns empty array on fetch error', async () => {
            const gene = uniqueGene();
            mockFetchTranscripts.mockRejectedValue(new Error('Network error'));

            const result = await fetchTranscriptsFromEnsembl(gene, 'GRCh38');

            assert.deepEqual(result, []);
        });

        it('sets biotype to processed_transcript when proteinLength is 0', async () => {
            const gene = uniqueGene();
            const transcript = makeGNTranscript({ proteinLength: 0 });
            mockFetchTranscripts.mockResolvedValue([transcript]);
            mockFetchCanonical.mockResolvedValue(null);

            const result = await fetchTranscriptsFromEnsembl(gene, 'GRCh38');

            assert.equal(result[0].biotype, 'processed_transcript');
            assert.isUndefined(result[0].proteinLength);
        });
    });

    // -------------------------------------------------------------------
    // fetchTranscriptsForGeneWithFallback — isForteSelected logic
    // -------------------------------------------------------------------
    describe('fetchTranscriptsForGeneWithFallback', () => {
        it('marks matching transcript as isForteSelected when ensemblTranscriptId matches', async () => {
            const gene = uniqueGene();
            const t1 = makeGNTranscript({
                transcriptId: 'ENST00000111.2',
                proteinLength: 100,
            });
            const t2 = makeGNTranscript({
                transcriptId: 'ENST00000222.3',
                proteinLength: 200,
            });
            mockFetchTranscripts.mockResolvedValue([t1, t2]);
            mockFetchCanonical.mockResolvedValue(null);

            const result = await fetchTranscriptsForGeneWithFallback(
                gene,
                'ENST00000222.3',
                'GRCh38'
            );

            const selected = result.find((t: any) => t.isForteSelected);
            assert.isDefined(selected);
            assert.equal(selected!.transcriptId, 'ENST00000222');
        });

        it('matches transcript ID ignoring version suffix', async () => {
            const gene = uniqueGene();
            const t1 = makeGNTranscript({
                transcriptId: 'ENST00000333.1',
                proteinLength: 100,
            });
            mockFetchTranscripts.mockResolvedValue([t1]);
            mockFetchCanonical.mockResolvedValue(null);

            const result = await fetchTranscriptsForGeneWithFallback(
                gene,
                'ENST00000333.7',
                'GRCh38'
            );

            assert.isTrue(result[0].isForteSelected);
        });

        it('falls back to canonical transcript when SV transcript ID does not match', async () => {
            const gene = uniqueGene();
            const t1 = makeGNTranscript({
                transcriptId: 'ENST00000111.2',
                proteinLength: 100,
            });
            const t2 = makeGNTranscript({
                transcriptId: 'ENST00000222.3',
                proteinLength: 200,
            });
            mockFetchTranscripts.mockResolvedValue([t1, t2]);
            mockFetchCanonical.mockResolvedValue({
                transcriptId: 'ENST00000222.3',
            });

            const result = await fetchTranscriptsForGeneWithFallback(
                gene,
                'ENST00000999', // non-matching
                'GRCh38'
            );

            const selected = result.find((t: any) => t.isForteSelected);
            assert.isDefined(selected);
            assert.equal(selected!.transcriptId, 'ENST00000222');
        });

        it('falls back to first protein_coding when no canonical and no match', async () => {
            const gene = uniqueGene();
            const t1 = makeGNTranscript({
                transcriptId: 'ENST00000111.2',
                proteinLength: 0, // not protein_coding
            });
            const t2 = makeGNTranscript({
                transcriptId: 'ENST00000222.3',
                proteinLength: 300,
            });
            mockFetchTranscripts.mockResolvedValue([t1, t2]);
            mockFetchCanonical.mockResolvedValue(null);

            const result = await fetchTranscriptsForGeneWithFallback(
                gene,
                undefined,
                'GRCh38'
            );

            const selected = result.find((t: any) => t.isForteSelected);
            assert.isDefined(selected);
            assert.equal(selected!.transcriptId, 'ENST00000222');
        });

        it('falls back to first transcript when none are protein_coding', async () => {
            const gene = uniqueGene();
            const t1 = makeGNTranscript({
                transcriptId: 'ENST00000AAA.1',
                proteinLength: 0,
            });
            const t2 = makeGNTranscript({
                transcriptId: 'ENST00000BBB.1',
                proteinLength: 0,
            });
            mockFetchTranscripts.mockResolvedValue([t1, t2]);
            mockFetchCanonical.mockResolvedValue(null);

            const result = await fetchTranscriptsForGeneWithFallback(
                gene,
                undefined,
                'GRCh38'
            );

            assert.isTrue(result[0].isForteSelected);
            assert.isFalse(result[1].isForteSelected);
        });

        it('does not mutate cached transcripts (clone protection)', async () => {
            const gene = uniqueGene();
            const t1 = makeGNTranscript({
                transcriptId: 'ENST00000CLONE.1',
                proteinLength: 100,
            });
            mockFetchTranscripts.mockResolvedValue([t1]);
            mockFetchCanonical.mockResolvedValue(null);

            // First call: selects t1 with ID match
            const result1 = await fetchTranscriptsForGeneWithFallback(
                gene,
                'ENST00000CLONE',
                'GRCh38'
            );
            assert.isTrue(result1[0].isForteSelected);

            // Second call without ID: should NOT inherit isForteSelected from cache
            // (because the function clones before mutating)
            const result2 = await fetchTranscriptsForGeneWithFallback(
                gene,
                undefined,
                'GRCh38'
            );

            // result1 should be unaffected by the second call
            assert.isTrue(result1[0].isForteSelected);
            // result2 should have isForteSelected set via fallback
            assert.isTrue(result2[0].isForteSelected);
        });

        it('returns empty array when upstream returns empty', async () => {
            const gene = uniqueGene();
            mockFetchTranscripts.mockResolvedValue([]);
            mockFetchCanonical.mockResolvedValue(null);

            const result = await fetchTranscriptsForGeneWithFallback(
                gene,
                undefined,
                'GRCh38'
            );

            assert.deepEqual(result, []);
        });
    });
});

import { assert } from 'chai';

import { getAnnotationData, clearAnnotationCache } from './Annotation';
import {
    extractGenomicLocation,
    genomicLocationString,
} from 'cbioportal-utils';

function complete<T>(result: T): any {
    return {
        result,
        status: 'complete',
        isComplete: true,
        isPending: false,
        isError: false,
    };
}

function strongScores() {
    return [
        {
            output_type: 'RNA_SEQ',
            variant_scorer: 'GeneMaskLFCScorer',
            gene_id: 'ENSG00000159140',
            gene_name: 'SON',
            track_name: 'brain_rna_seq_plus',
            ontology_curie: 'UBERON:0000955',
            biosample_name: 'brain',
            raw_score: 0.8,
            quantile_score: 0.995,
        },
    ];
}

describe('getAnnotationData AlphaGenome retrigger', () => {
    beforeEach(() => {
        clearAnnotationCache();
    });

    it('returns fresh alphaGenome content when the Mongo cache refetch resolves', () => {
        const mutation: any = {
            chr: '21',
            startPosition: 34925124,
            endPosition: 34925124,
            referenceAllele: 'C',
            variantAllele: 'T',
            gene: { hugoGeneSymbol: 'SON', entrezGeneId: 6651 },
            proteinChange: '',
            mutationStatus: '',
            mutationType: '',
        };
        const key = genomicLocationString(extractGenomicLocation(mutation)!)!;

        const first = getAnnotationData(
            mutation,
            complete([]),
            complete({}),
            complete({ indicatorMap: {} }),
            false,
            complete({}),
            complete({}),
            complete({}),
            undefined,
            undefined,
            complete({
                [key]: {
                    alpha_genome: {
                        license: 'test',
                        annotation: {
                            variant: '21:g.34925124C>T',
                            hg38_variant: 'chr21:33552818:C>T',
                            canonical_gene: 'SON',
                            scores: strongScores(),
                        },
                    },
                },
            })
        );
        assert.equal(
            (first.alphaGenome as any)?.annotation?.canonical_gene,
            'SON'
        );

        // Same mutation, retriggered fetch with cache clear (e.g. fresh Mongo cache
        // content refetched). The column picks up the new payload.
        clearAnnotationCache();
        const second = getAnnotationData(
            mutation,
            complete([]),
            complete({}),
            complete({ indicatorMap: {} }),
            false,
            complete({}),
            complete({}),
            complete({}),
            undefined,
            undefined,
            complete({
                [key]: {
                    alpha_genome: {
                        license: 'test',
                        annotation: {
                            variant: '21:g.34925124C>T',
                            hg38_variant: 'chr21:33552818:C>T',
                            canonical_gene: 'SON-UPDATED',
                            scores: [],
                        },
                    },
                },
            })
        );
        assert.equal(
            (second.alphaGenome as any)?.annotation?.canonical_gene,
            'SON-UPDATED'
        );
    });

    it('does not poison the cache while AlphaGenome is still idle', () => {
        const mutation: any = {
            chr: '21',
            startPosition: 34925124,
            endPosition: 34925124,
            referenceAllele: 'C',
            variantAllele: 'T',
            gene: { hugoGeneSymbol: 'SON', entrezGeneId: 6651 },
            proteinChange: '',
            mutationStatus: '',
            mutationType: '',
        };
        const key = genomicLocationString(extractGenomicLocation(mutation)!)!;

        const idleRemoteData: any = {
            result: undefined,
            status: 'complete',
            isComplete: true,
            isPending: false,
            isError: false,
        };

        const cold = getAnnotationData(
            mutation,
            complete([]),
            complete({}),
            complete({ indicatorMap: {} }),
            false,
            complete({}),
            complete({}),
            complete({}),
            undefined,
            undefined,
            idleRemoteData
        );
        assert.isUndefined(cold.alphaGenome);

        // First trigger resolves from the Mongo cache: same mutation must
        // now read the fresh payload instead of the idle undefined.
        const scored = getAnnotationData(
            mutation,
            complete([]),
            complete({}),
            complete({ indicatorMap: {} }),
            false,
            complete({}),
            complete({}),
            complete({}),
            undefined,
            undefined,
            complete({
                [key]: {
                    alpha_genome: {
                        license: 'test',
                        annotation: {
                            variant: '21:g.34925124C>T',
                            hg38_variant: 'chr21:33552818:C>T',
                            canonical_gene: 'SON',
                            scores: strongScores(),
                        },
                    },
                },
            })
        );
        assert.equal(
            (scored.alphaGenome as any)?.annotation?.canonical_gene,
            'SON'
        );
    });
});

import { assert } from 'chai';
import { Mutation } from 'cbioportal-utils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';

import {
    getGermlineCdnaChange,
    getOncoKbAlteration,
    IndexedVariantAnnotations,
} from './OncoKbAlterationHelper';

// The annotation map is keyed by genomicLocationString(extractGenomicLocation);
// for the fixtures below that key is "17,41276044,41276044,A,G".
const GENOMIC_LOCATION_KEY = '17,41276044,41276044,A,G';

function makeMutation(overrides: Partial<Mutation> = {}): Mutation {
    return {
        gene: { hugoGeneSymbol: 'BRCA1' },
        proteinChange: 'R1443*',
        mutationStatus: 'Germline',
        chromosome: '17',
        startPosition: 41276044,
        endPosition: 41276044,
        referenceAllele: 'A',
        variantAllele: 'G',
        ...overrides,
    } as Mutation;
}

function makeIndexedAnnotations(hgvsc: string): IndexedVariantAnnotations {
    return {
        [GENOMIC_LOCATION_KEY]: {
            annotation_summary: {
                transcriptConsequenceSummary: { hgvsc },
            },
        } as VariantAnnotation,
    };
}

describe('OncoKbAlterationHelper', () => {
    describe('getOncoKbAlteration', () => {
        it('returns the somatic protein change for somatic mutations', () => {
            const mutation = makeMutation({ mutationStatus: 'Somatic' });
            const annotations = makeIndexedAnnotations(
                'ENST00000357654:c.4327C>T'
            );
            assert.equal(getOncoKbAlteration(mutation, annotations), 'R1443*');
        });

        it('returns "HUGO:cDNA" for germline mutations with HGVSc and hugo symbol', () => {
            const mutation = makeMutation();
            const annotations = makeIndexedAnnotations(
                'ENST00000357654:c.4327C>T'
            );
            assert.equal(
                getOncoKbAlteration(mutation, annotations),
                'BRCA1:c.4327C>T'
            );
        });

        it('returns empty string for germline mutations without a hugo symbol', () => {
            const mutation = makeMutation({ gene: {} as any });
            const annotations = makeIndexedAnnotations(
                'ENST00000357654:c.4327C>T'
            );
            assert.equal(getOncoKbAlteration(mutation, annotations), '');
        });

        it('returns empty string (never protein change) for germline mutations without HGVSc', () => {
            const mutation = makeMutation();
            // no annotations available -> no cDNA change
            assert.equal(getOncoKbAlteration(mutation, undefined), '');
        });
    });

    describe('getGermlineCdnaChange', () => {
        it('extracts the bare cDNA change for germline mutations', () => {
            const mutation = makeMutation();
            const annotations = makeIndexedAnnotations(
                'ENST00000357654:c.4327C>T'
            );
            assert.equal(
                getGermlineCdnaChange(mutation, annotations),
                'c.4327C>T'
            );
        });

        it('returns undefined for somatic mutations', () => {
            const mutation = makeMutation({ mutationStatus: 'Somatic' });
            const annotations = makeIndexedAnnotations(
                'ENST00000357654:c.4327C>T'
            );
            assert.isUndefined(getGermlineCdnaChange(mutation, annotations));
        });
    });
});

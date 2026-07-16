import { assert } from 'chai';

import { Mutation } from 'cbioportal-utils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';

import {
    fetchVariantAnnotationsByMutation,
    initGenomeNexusClient,
} from './DataFetcherUtils';

/**
 * This spec is a consumer contract check against a REAL Genome Nexus instance,
 * not the rest of this repo's mocked-client unit tests. It only runs when
 * GENOME_NEXUS_CONTRACT_URL is set (e.g. by a CI job that just built and
 * booted a candidate Genome Nexus image), so it never makes network calls
 * as part of a normal `pnpm test` run.
 *
 * It asserts structural invariants the Mutation page depends on (non-empty
 * transcript consequences, a resolvable canonical transcript, etc) rather
 * than exact field values, so it stays robust to legitimate annotation
 * content changes while still catching the class of regression where Genome
 * Nexus silently starts returning an empty/degenerate response for a
 * variant it used to annotate successfully.
 */
const GENOME_NEXUS_CONTRACT_URL = process.env.GENOME_NEXUS_CONTRACT_URL;

const describeIfContractUrlSet = GENOME_NEXUS_CONTRACT_URL
    ? describe
    : describe.skip;

// Known-good, previously-annotated variants reused from MutationAnnotator.spec.ts
// fixtures. Each entry documents the gene the variant is expected to be
// annotated against, used only for a human-readable failure message.
const GOLDEN_VARIANTS: {
    hugoGeneSymbol: string;
    mutation: Partial<Mutation>;
}[] = [
    {
        hugoGeneSymbol: 'AR',
        mutation: {
            chromosome: 'X',
            startPosition: 66937331,
            endPosition: 66937331,
            referenceAllele: 'T',
            variantAllele: 'A',
        },
    },
    {
        hugoGeneSymbol: 'TP53',
        mutation: {
            chromosome: '17',
            startPosition: 7577539,
            endPosition: 7577539,
            referenceAllele: 'G',
            variantAllele: 'A',
        },
    },
    {
        hugoGeneSymbol: 'BRCA2',
        mutation: {
            chromosome: '13',
            startPosition: 32912813,
            endPosition: 32912813,
            referenceAllele: 'G',
            variantAllele: 'T',
        },
    },
];

jest.setTimeout(30000);

describeIfContractUrlSet('Genome Nexus contract (live instance)', () => {
    const client = initGenomeNexusClient(GENOME_NEXUS_CONTRACT_URL);

    test.each(GOLDEN_VARIANTS)(
        'returns a non-degenerate annotation_summary for $hugoGeneSymbol',
        async ({ mutation }) => {
            const annotations: VariantAnnotation[] = await fetchVariantAnnotationsByMutation(
                [mutation],
                ['annotation_summary'],
                'mskcc',
                client
            );

            assert.lengthOf(
                annotations,
                1,
                'expected exactly one annotation for the requested genomic location'
            );

            const [annotation] = annotations;

            assert.isTrue(
                annotation.successfully_annotated,
                'expected the variant to be successfully annotated'
            );

            const summary = annotation.annotation_summary;
            assert.isOk(summary, 'expected annotation_summary to be present');

            assert.isTrue(
                !!summary.canonicalTranscriptId &&
                    summary.canonicalTranscriptId.length > 0,
                'expected a resolvable canonical transcript id'
            );

            assert.isArray(summary.transcriptConsequenceSummaries);
            assert.isTrue(
                summary.transcriptConsequenceSummaries.length > 0,
                'expected at least one transcript consequence — an empty list ' +
                    'means the frontend has nothing to render for protein ' +
                    'change/HGVSp on the Mutation page for this variant'
            );

            assert.isOk(
                summary.transcriptConsequenceSummary,
                'expected a canonical transcript consequence to be selected'
            );
            assert.isTrue(
                !!summary.transcriptConsequenceSummary.variantClassification &&
                    summary.transcriptConsequenceSummary.variantClassification
                        .length > 0,
                'expected the canonical transcript consequence to have a variant classification'
            );
        }
    );
});

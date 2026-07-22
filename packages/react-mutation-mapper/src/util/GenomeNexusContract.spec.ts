import { assert } from 'chai';

import {
    Mutation,
    extractGenomicLocation,
    genomicLocationString,
    indexAnnotationsByGenomicLocation,
} from 'cbioportal-utils';
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
 * Two invariant classes are covered:
 *  - successful annotations expose the structural shape the Mutation page
 *    renders from (non-empty transcript consequences, a resolvable
 *    canonical transcript, etc);
 *  - EVERY response object — including ones for variants that fail VEP
 *    annotation — must still be correlatable back to its query via
 *    `indexAnnotationsByGenomicLocation`, the same lookup
 *    `MutationAnnotator`/`GenomeNexusCache` use in production. Genome Nexus
 *    previously matched batch responses back to queries using VEP's
 *    `variantId`, which is null on VEP errors, so a failed variant's
 *    `originalVariantQuery` was left unset (fixed in genome-nexus#864).
 *    Confirmed locally against the pre-fix build: this doesn't just drop
 *    the failed entry — `indexAnnotationsByGenomicLocation`'s fallback key
 *    reconstruction (`genomicLocationStringFromVariantAnnotation`) reads
 *    VEP-echoed fields that are *also* unset on that same object, throwing
 *    and aborting correlation for the whole batch, good variants included.
 *    A test that only ever queries known-good variants can't see this
 *    class of regression — it requires a mixed batch.
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

// Variants confirmed (2026-07-22, against a live Genome Nexus instance) to
// fail VEP annotation — i.e. genome-nexus itself returns
// `successfully_annotated: false` for these, not a client-side/network
// error. Used to verify failed annotations still round-trip correctly
// through the batch response instead of silently vanishing.
const FAILING_VARIANTS: {
    description: string;
    mutation: Partial<Mutation>;
}[] = [
    {
        description: 'chr4:1805669 G>C (unmappable by VEP)',
        mutation: {
            chromosome: '4',
            startPosition: 1805669,
            endPosition: 1805669,
            referenceAllele: 'G',
            variantAllele: 'C',
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

    test('correlates both successful and failed annotations back to their query in a mixed batch', async () => {
        const mutations = [
            ...GOLDEN_VARIANTS.map(v => v.mutation),
            ...FAILING_VARIANTS.map(v => v.mutation),
        ];

        const annotations: VariantAnnotation[] = await fetchVariantAnnotationsByMutation(
            mutations,
            ['annotation_summary'],
            'mskcc',
            client
        );

        // Mirrors how MutationAnnotator/GenomeNexusCache index a batch
        // response in production — by originalVariantQuery, not by array
        // order or count.
        const indexed = indexAnnotationsByGenomicLocation(annotations);

        for (const { hugoGeneSymbol, mutation } of GOLDEN_VARIANTS) {
            const key = genomicLocationString(extractGenomicLocation(mutation)!);
            const annotation = indexed[key];

            assert.isOk(
                annotation,
                `expected a correlatable annotation for ${hugoGeneSymbol} (key ${key})`
            );
            assert.isTrue(
                annotation.successfully_annotated,
                `expected ${hugoGeneSymbol} to be successfully annotated`
            );
            assert.isOk(
                annotation.annotation_summary,
                `expected annotation_summary for ${hugoGeneSymbol}`
            );
        }

        for (const { description, mutation } of FAILING_VARIANTS) {
            const key = genomicLocationString(extractGenomicLocation(mutation)!);
            const annotation = indexed[key];

            // This is the regression genome-nexus#864 fixed: a failed VEP
            // annotation was matched back to its query using VEP's
            // `variantId`, which is null on errors, so `originalVariantQuery`
            // was left unset. Pre-fix, this line doesn't just fail this
            // assertion — indexAnnotationsByGenomicLocation() above throws
            // while building the index, taking the whole batch down with it.
            assert.isOk(
                annotation,
                `expected a correlatable (if failed) annotation for ${description} ` +
                    `(key ${key}) — a missing entry here means a failed ` +
                    'annotation is indistinguishable from no response at all'
            );
            assert.isFalse(
                annotation.successfully_annotated,
                `expected ${description} to be flagged as a failed annotation`
            );
            assert.isTrue(
                !!annotation.errorMessage && annotation.errorMessage.length > 0,
                `expected a non-empty errorMessage for ${description}`
            );
        }
    });
});

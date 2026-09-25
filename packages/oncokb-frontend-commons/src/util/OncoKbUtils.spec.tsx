import { assert } from 'chai';

import { Mutation } from 'cbioportal-utils';

import { StructuralVariant } from 'cbioportal-ts-api-client';

import {
    defaultOncoKbIndicatorFilter,
    fetchCuratedGenesByHugoSymbol,
    GERMLINE_CURATED_GENE_SETTING,
    generateAnnotateStructuralVariantQuery,
    generateGermlineStructuralVariantIndicator,
    generateQueryStructuralVariantId,
    getIndicatorData,
    getStructuralVariantAlterationName,
    getPositionalVariant,
    groupOncoKbIndicatorDataByMutations,
    parseOncoKBAbstractReference,
    toOncoKbReferenceGenome,
} from './OncoKbUtils';

describe('OncoKbUtils', () => {
    describe('toOncoKbReferenceGenome', () => {
        it('normalizes the GRCh37 aliases cBioPortal studies use', () => {
            assert.equal(toOncoKbReferenceGenome('GRCh37'), 'GRCh37');
            assert.equal(toOncoKbReferenceGenome('37'), 'GRCh37');
            assert.equal(toOncoKbReferenceGenome('hg19'), 'GRCh37');
        });

        it('normalizes the GRCh38 aliases cBioPortal studies use', () => {
            assert.equal(toOncoKbReferenceGenome('GRCh38'), 'GRCh38');
            assert.equal(toOncoKbReferenceGenome('38'), 'GRCh38');
            assert.equal(toOncoKbReferenceGenome('hg38'), 'GRCh38');
        });

        it('is case insensitive', () => {
            assert.equal(toOncoKbReferenceGenome('grch38'), 'GRCh38');
            assert.equal(toOncoKbReferenceGenome('HG19'), 'GRCh37');
        });

        it('falls back to GRCh37 for missing or unrecognized builds', () => {
            assert.equal(toOncoKbReferenceGenome(undefined), 'GRCh37');
            assert.equal(toOncoKbReferenceGenome(''), 'GRCh37');
            assert.equal(toOncoKbReferenceGenome('NA'), 'GRCh37');
        });
    });

    describe('groupOncoKbIndicatorDataByMutations', () => {
        const mutationsByPosition = {
            [666]: [
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_66',
                    proteinChange: 'D666V',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 666,
                    proteinPosEnd: 666,
                },
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_67',
                    proteinChange: 'D666Z',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 666,
                    proteinPosEnd: 666,
                },
            ],
            [790]: [
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_0',
                    proteinChange: 'T790M',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 790,
                    proteinPosEnd: 790,
                },
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_1',
                    proteinChange: 'T790M',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 790,
                    proteinPosEnd: 790,
                },
            ],
            [858]: [
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_2',
                    proteinChange: 'L858R',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 858,
                    proteinPosEnd: 858,
                },
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_3',
                    proteinChange: 'L858R',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 858,
                    proteinPosEnd: 858,
                },
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_4',
                    proteinChange: 'L858R',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 858,
                    proteinPosEnd: 858,
                },
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_5',
                    proteinChange: 'L858L',
                    mutationType: 'Silent',
                    proteinPosStart: 858,
                    proteinPosEnd: 858,
                },
            ],
            [719]: [
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_g0',
                    proteinChange: 'G719S',
                    mutationType: 'Missense_Mutation',
                    mutationStatus: 'Germline',
                    proteinPosStart: 719,
                    proteinPosEnd: 719,
                },
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_g1',
                    proteinChange: 'G719A',
                    mutationType: 'Missense_Mutation',
                    mutationStatus: 'Germline',
                    proteinPosStart: 719,
                    proteinPosEnd: 719,
                },
            ],
        };

        const uniqueSampleKeyToTumorType: { [key: string]: string } = {
            uniqueSampleKey_0: 'Lung Adenocarcinoma',
            uniqueSampleKey_1: 'Lung Adenocarcinoma',
            uniqueSampleKey_2: 'Lung Adenocarcinoma',
            uniqueSampleKey_3: 'Lung Adenocarcinoma',
            uniqueSampleKey_4: 'Lung Adenocarcinoma',
            uniqueSampleKey_5: 'Lung Adenocarcinoma',
            uniqueSampleKey_66: 'Lung Adenocarcinoma',
            uniqueSampleKey_67: 'Lung Adenocarcinoma',
            uniqueSampleKey_g0: 'Lung Adenocarcinoma',
            uniqueSampleKey_g1: 'Lung Adenocarcinoma',
        };

        const oncoKbData = {
            indicatorMap: {
                '1956_Lung_Adenocarcinoma_T790M_Missense_Mutation': {
                    query: { germline: false },
                    oncogenic: 'Oncogenic',
                    mutationEffect: {
                        knownEffect: 'Gain-of-function',
                    },
                },
                '1956_Lung_Adenocarcinoma_L858R_Missense_Mutation': {
                    query: { germline: false },
                    oncogenic: 'Likely Oncogenic',
                    mutationEffect: {
                        knownEffect: 'Gain-of-function',
                    },
                },
                '1956_Lung_Adenocarcinoma_D666V_Missense_Mutation': {
                    query: { germline: false },
                    oncogenic: 'Inconclusive',
                    mutationEffect: {
                        knownEffect: 'Unknown',
                    },
                },
                '1956_Lung_Adenocarcinoma_D666Z_Missense_Mutation': {
                    query: { germline: false },
                    oncogenic: 'Unknown',
                    mutationEffect: {
                        knownEffect: 'None',
                    },
                },
                '1956_Lung_Adenocarcinoma_L858L_Silent': {
                    query: { germline: false },
                    oncogenic: 'NA',
                    mutationEffect: {
                        knownEffect: 'NA',
                    },
                },
                // Germline mutations get a `_germline` id suffix and are kept
                // based on pathogenicity rather than somatic oncogenicity.
                '1956_Lung_Adenocarcinoma_G719S_Missense_Mutation_germline': {
                    query: { germline: true },
                    pathogenic: 'Pathogenic',
                },
                '1956_Lung_Adenocarcinoma_G719A_Missense_Mutation_germline': {
                    query: { germline: true },
                    pathogenic: 'Benign',
                },
            },
        };

        it('groups OncoKB indicator data by mutation protein positions', () => {
            const grouped = groupOncoKbIndicatorDataByMutations(
                mutationsByPosition,
                oncoKbData as any,
                (mutation: Mutation) =>
                    uniqueSampleKeyToTumorType[
                        (mutation as any).uniqueSampleKey
                    ],
                (mutation: Mutation) => (mutation as any).gene.entrezGeneId,
                defaultOncoKbIndicatorFilter
            );

            assert.equal(
                grouped[790].length,
                2,
                'all should be picked by the indicator filter as oncogenic at position 790'
            );
            assert.equal(
                grouped[858].length,
                3,
                '3 out of 4 should be picked by the indicator filter as oncogenic at position 858'
            );
            assert.isUndefined(
                grouped[666],
                'none should be picked by the indicator filter as oncogenic at position 666'
            );
            assert.equal(
                grouped[719].length,
                1,
                'only the pathogenic germline mutation should be picked at position 719'
            );
        });
    });

    describe('getPositionalVariant', () => {
        it('Missense with one amino acid change', () => {
            const missenseAlteration = 'V600E';
            const expectedPositionalVariant = 'V600';
            assert.equal(
                getPositionalVariant(missenseAlteration),
                expectedPositionalVariant,
                'V600 should be returned'
            );
        });
        it('Missense with multiple amino acid changes', () => {
            const missenseAlteration = 'VK600EI';
            const expectedPositionalVariant = 'V600';
            assert.equal(
                getPositionalVariant(missenseAlteration),
                expectedPositionalVariant,
                'V600 should be returned'
            );
        });
        it('Input is positional alteration', () => {
            const oneAAAlteration = 'V600';
            const twoAAAlteration = 'VK600';
            const expectedPositionalVariant = 'V600';
            assert.equal(
                getPositionalVariant(oneAAAlteration),
                expectedPositionalVariant,
                'V600 should be returned'
            );
            assert.equal(
                getPositionalVariant(twoAAAlteration),
                expectedPositionalVariant,
                'V600 should be returned'
            );
        });
        it('Undefined returned for delins missense alteration', () => {
            // the structure is too complex to parse, we simply skip for this scenario
            const missenseAlteration = 'M277_D278delinsIY';
            assert.equal(
                getPositionalVariant(missenseAlteration),
                undefined,
                'undefined should be returned'
            );
        });
        it('Undefined returned for other type of alteration', () => {
            const inframeDeletion = 'N486_T491delinsK';
            assert.equal(
                getPositionalVariant(inframeDeletion),
                undefined,
                'undefined should be returned'
            );
        });
        it('Undefined returned for empty string', () => {
            const missenseAlteration = '';
            assert.equal(
                getPositionalVariant(missenseAlteration),
                undefined,
                'V600 should be returned'
            );
        });
    });

    describe('parseOncoKBAbstractReference', () => {
        it('Valid abstract reference passed', () => {
            const abstractReference =
                '(Abstract: Hunger et al. ASH 2017. http://www.bloodjournal.org/content/130/Suppl_1/98)';
            const expectedOutput = {
                abstractTitle: 'Hunger et al. ASH 2017.',
                abstractLink:
                    'http://www.bloodjournal.org/content/130/Suppl_1/98',
            };
            assert.deepEqual(
                parseOncoKBAbstractReference(abstractReference),
                expectedOutput
            );
        });
        it('Invalid abstract reference containing abstract string', () => {
            const abstractReference =
                '(Abstract: Fakih et al. Abstract# 3003, ASCO 2019. https://meetinglibrary.asco.org/record/12411/Abstract)';
            const expectedOutput = {
                abstractTitle: 'Fakih et al. Abstract# 3003, ASCO 2019.',
                abstractLink:
                    'https://meetinglibrary.asco.org/record/12411/Abstract',
            };
            assert.deepEqual(
                parseOncoKBAbstractReference(abstractReference),
                expectedOutput
            );
        });
        it('Undefined returned for abstract with missing link', () => {
            const abstractReference = '(Abstract: Hunger et al. ASH 2017.)';
            assert.equal(
                parseOncoKBAbstractReference(abstractReference),
                undefined,
                'undefined should be returned'
            );
        });
        it('Undefined returned for non-abstract reference', () => {
            const pmidReference = '(PMID: 11753428)';
            assert.equal(
                parseOncoKBAbstractReference(pmidReference),
                undefined,
                'undefined should be returned'
            );
        });
        it('Undefined returned for empty string', () => {
            const abstractReference = '';
            assert.equal(
                parseOncoKBAbstractReference(abstractReference),
                undefined,
                'undefined should be returned'
            );
        });
    });
    describe('getStructuralVariantAlterationName', () => {
        it('names a fusion after both genes', () => {
            assert.equal(
                getStructuralVariantAlterationName({
                    site1HugoSymbol: 'BRCA1',
                    site2HugoSymbol: 'SORCS2',
                } as StructuralVariant),
                'BRCA1-SORCS2 Fusion'
            );
        });

        it('names a single-gene variant intragenic', () => {
            assert.equal(
                getStructuralVariantAlterationName({
                    site1HugoSymbol: 'BRCA1',
                    site2HugoSymbol: '',
                } as StructuralVariant),
                'BRCA1 intragenic'
            );
        });

        it('treats the same gene on both sides as intragenic', () => {
            assert.equal(
                getStructuralVariantAlterationName({
                    site1HugoSymbol: 'BRCA1',
                    site2HugoSymbol: 'BRCA1',
                } as StructuralVariant),
                'BRCA1 intragenic'
            );
        });

        it('falls back to a generic label when neither side names a gene', () => {
            assert.equal(
                getStructuralVariantAlterationName({
                    site1HugoSymbol: '',
                    site2HugoSymbol: '',
                } as StructuralVariant),
                'Structural Variant'
            );
        });
    });

    describe('germline structural variants', () => {
        const TUMOR_TYPE = 'Breast Invasive Ductal Carcinoma';

        // BRCA1 intragenic deletion: only site 1 carries a gene, so the query
        // is an intragenic (non-functional-fusion) DELETION.
        function brca1Intragenic(svStatus: string) {
            return {
                site1EntrezGeneId: 672,
                site1HugoSymbol: 'BRCA1',
                site2HugoSymbol: '',
                variantClass: 'DELETION',
                svStatus,
            } as StructuralVariant;
        }

        // The mutation table renders structural variants as pseudo-mutations
        // that carry the original variant; getIndicatorData keys off that.
        function asPseudoMutation(structuralVariant: StructuralVariant) {
            return {
                entrezGeneId: 672,
                proteinChange: 'BRCA1 intragenic',
                mutationType: 'fusion',
                mutationStatus: structuralVariant.svStatus,
                structuralVariant,
            } as any;
        }

        // The endpoint this query targets only annotates somatic variants, so
        // the query is somatic whatever svStatus the variant carries.
        it('builds a somatic query', () => {
            const query = generateAnnotateStructuralVariantQuery(
                brca1Intragenic('SOMATIC'),
                TUMOR_TYPE
            );

            assert.isFalse((query as any).germline);
            assert.notInclude(query.id, '_germline');
            assert.isFalse(
                query.functionalFusion,
                'a single-gene variant is intragenic, not a functional fusion'
            );
            assert.equal(query.structuralVariantType, 'DELETION');
        });

        it('gives germline and somatic variants distinct query ids', () => {
            const germlineId = generateQueryStructuralVariantId(
                672,
                undefined,
                TUMOR_TYPE,
                'DELETION',
                true
            );
            const somaticId = generateQueryStructuralVariantId(
                672,
                undefined,
                TUMOR_TYPE,
                'DELETION'
            );

            assert.notEqual(germlineId, somaticId);
            assert.equal(germlineId, `${somaticId}_germline`);
        });

        // OncoKB has no germline SV curation, so the card falls back to the
        // gene-level entry instead of rendering empty.
        it('builds a gene-level indicator the germline row resolves to', () => {
            const curatedGene = {
                hugoSymbol: 'BRCA1',
                entrezGeneId: 672,
                summary: 'BRCA1 gene summary',
                background: 'BRCA1 gene background',
            } as any;

            const indicator = generateGermlineStructuralVariantIndicator(
                brca1Intragenic('GERMLINE'),
                TUMOR_TYPE,
                curatedGene
            ) as any;

            assert.isTrue(indicator.query.germline);
            assert.equal(indicator.query.hugoSymbol, 'BRCA1');
            assert.equal(indicator.query.alteration, 'BRCA1 intragenic');
            assert.equal(indicator.geneSummary, 'BRCA1 gene summary');
            assert.equal(indicator.pathogenic, 'Unknown');
            assert.equal(indicator.mutationEffect.knownEffect, 'Unknown');

            assert.equal(
                getIndicatorData(
                    asPseudoMutation(brca1Intragenic('GERMLINE')),
                    { indicatorMap: { [indicator.query.id]: indicator } },
                    () => TUMOR_TYPE,
                    () => 672
                ),
                indicator
            );
        });

        it('leaves the gene summary empty when the gene is not curated', () => {
            const indicator = generateGermlineStructuralVariantIndicator(
                brca1Intragenic('GERMLINE'),
                TUMOR_TYPE
            ) as any;

            assert.equal(indicator.geneSummary, '');
            assert.isFalse(indicator.geneExist);
            assert.equal(indicator.pathogenic, 'Unknown');
        });

        // OncoKB has nothing to say about a germline SV, so the card states
        // that rather than leaving the summaries blank.
        it('states that the variant is not included in OncoKB', () => {
            const indicator = generateGermlineStructuralVariantIndicator(
                brca1Intragenic('GERMLINE'),
                TUMOR_TYPE
            ) as any;

            assert.equal(
                indicator.variantSummary,
                'This BRCA1 intragenic variant is not currently included in ' +
                    'OncoKB. OncoKB germline annotation is limited to ' +
                    'pathogenic and likely pathogenic germline variants ' +
                    'identified in patients sequenced at MSK.'
            );
            assert.equal(
                indicator.tumorTypeSummary,
                'There are no FDA-approved or NCCN-compendium listed ' +
                    'treatments specifically for patients with breast ' +
                    'invasive ductal carcinoma harboring this BRCA1 ' +
                    'intragenic variant.'
            );
        });

        it('names the fusion when the variant spans two genes', () => {
            const indicator = generateGermlineStructuralVariantIndicator(
                ({
                    site1EntrezGeneId: 672,
                    site1HugoSymbol: 'BRCA1',
                    site2EntrezGeneId: 57537,
                    site2HugoSymbol: 'SORCS2',
                    svStatus: 'GERMLINE',
                } as unknown) as StructuralVariant,
                TUMOR_TYPE
            ) as any;

            assert.equal(indicator.query.alteration, 'BRCA1-SORCS2 Fusion');
            assert.include(
                indicator.variantSummary,
                'This BRCA1-SORCS2 Fusion variant is not currently included in OncoKB.'
            );
            assert.include(
                indicator.tumorTypeSummary,
                'harboring this BRCA1-SORCS2 Fusion variant.'
            );
        });

        it('drops the cancer type from the treatment summary when unknown', () => {
            const indicator = generateGermlineStructuralVariantIndicator(
                brca1Intragenic('GERMLINE'),
                null
            ) as any;

            assert.equal(
                indicator.tumorTypeSummary,
                'There are no FDA-approved or NCCN-compendium listed treatments specifically for patients harboring this BRCA1 intragenic variant.'
            );
        });

        // The regression the ticket reported: a somatic sibling elsewhere in
        // the cohort put a Truncating Mutations indicator in the map, and the
        // germline row resolved to it because the two shared a key.
        it('does not resolve a germline variant to a somatic sibling indicator', () => {
            const somaticIndicator = {
                query: {
                    id: generateAnnotateStructuralVariantQuery(
                        brca1Intragenic('SOMATIC'),
                        TUMOR_TYPE
                    ).id,
                    germline: false,
                },
                oncogenic: 'Oncogenic',
            } as any;

            const oncoKbData = {
                indicatorMap: {
                    [somaticIndicator.query.id]: somaticIndicator,
                },
            };

            const getTumorType = () => TUMOR_TYPE;
            const getEntrezGeneId = () => 672;

            assert.isUndefined(
                getIndicatorData(
                    asPseudoMutation(brca1Intragenic('GERMLINE')),
                    oncoKbData,
                    getTumorType,
                    getEntrezGeneId
                ),
                'germline variant must not pick up the somatic annotation'
            );
            assert.equal(
                getIndicatorData(
                    asPseudoMutation(brca1Intragenic('SOMATIC')),
                    oncoKbData,
                    getTumorType,
                    getEntrezGeneId
                ),
                somaticIndicator,
                'somatic variants are unaffected'
            );
        });

        // A gene is curated once per setting and both entries come back from
        // the same lookup, so the germline one has to be picked explicitly.
        it('picks the curated gene matching the requested setting', async () => {
            const client = {
                utilsAllCuratedGenesGetUsingGET_1: () =>
                    Promise.resolve([
                        {
                            hugoSymbol: 'BRCA1',
                            setting: 'Somatic',
                            summary: 'BRCA1 somatic gene summary',
                        },
                        {
                            hugoSymbol: 'BRCA1',
                            setting: 'Germline',
                            summary: 'BRCA1 germline gene summary',
                        },
                    ]),
            } as any;

            const germlineGenes = await fetchCuratedGenesByHugoSymbol(
                ['BRCA1'],
                client,
                GERMLINE_CURATED_GENE_SETTING
            );
            assert.equal(
                germlineGenes['BRCA1'].summary,
                'BRCA1 germline gene summary'
            );

            const anyGenes = await fetchCuratedGenesByHugoSymbol(
                ['BRCA1'],
                client
            );
            assert.equal(
                anyGenes['BRCA1'].summary,
                'BRCA1 somatic gene summary',
                'without a setting the first curated entry is used'
            );
        });

        it('leaves the gene uncurated when the setting has no entry', async () => {
            const client = {
                utilsAllCuratedGenesGetUsingGET_1: () =>
                    Promise.resolve([
                        {
                            hugoSymbol: 'BRCA1',
                            setting: 'Somatic',
                            summary: 'BRCA1 somatic gene summary',
                        },
                    ]),
            } as any;

            const genes = await fetchCuratedGenesByHugoSymbol(
                ['BRCA1'],
                client,
                GERMLINE_CURATED_GENE_SETTING
            );

            assert.isUndefined(genes['BRCA1']);
        });
    });
});

import {assert} from "chai";
import sinon from 'sinon';
import * as _ from 'lodash';

import {annotateMutations, resolveMissingProteinPositions} from "./MutationAnnotator";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {initMutation} from "test/MutationMockUtils";

describe("MutationAnnotator", () => {
    const fetchStubResponse = [
        {
            "variant": "X:g.66937331T>A",
            "id": "X:g.66937331T>A",
            "assembly_name": "GRCh37",
            "seq_region_name": "X",
            "start": 66937331,
            "end": 66937331,
            "allele_string": "T/A",
            "strand": 1,
            "most_severe_consequence": "missense_variant",
            "annotation_summary": {
                "variant": "X:g.66937331T>A",
                "genomicLocation": {
                    "chromosome": "X",
                    "start": 66937331,
                    "end": 66937331,
                    "referenceAllele": "T",
                    "variantAllele": "A"
                },
                "strandSign": "+",
                "variantType": "SNP",
                "assemblyName": "GRCh37",
                "canonicalTranscriptId": "ENST00000374690",
                "transcriptConsequences": [
                    {
                        "transcriptId": "ENST00000374690",
                        "codonChange": "Tta/Ata",
                        "entrezGeneId": "367",
                        "consequenceTerms": "missense_variant",
                        "hugoGeneSymbol": "AR",
                        "hgvspShort": "p.L729I",
                        "hgvsp": "p.Leu729Ile",
                        "hgvsc": "ENST00000374690.3:c.2185T>A",
                        "proteinPosition": {
                            "start": 729,
                            "end": 729
                        },
                        "refSeq": "NM_000044.3",
                        "variantClassification": "Missense_Mutation"
                    }
                ]
            }
        },
        {
            "variant": "17:g.41242962_41242963insGA",
            "id": "17:g.41242962_41242963insGA",
            "assembly_name": "GRCh37",
            "seq_region_name": "17",
            "start": 41242963,
            "end": 41242962,
            "allele_string": "-/GA",
            "strand": 1,
            "most_severe_consequence": "frameshift_variant",
            "annotation_summary": {
                "variant": "17:g.41242962_41242963insGA",
                "genomicLocation": {
                    "chromosome": "17",
                    "start": 41242962,
                    "end": 41242963,
                    "referenceAllele": "-",
                    "variantAllele": "GA"
                },
                "strandSign": "+",
                "variantType": "INS",
                "assemblyName": "GRCh37",
                "canonicalTranscriptId": "ENST00000471181",
                "transcriptConsequences": [
                    {
                        "transcriptId": "ENST00000471181",
                        "codonChange": "cag/cTCag",
                        "entrezGeneId": "672",
                        "consequenceTerms": "frameshift_variant,splice_region_variant",
                        "hugoGeneSymbol": "BRCA1",
                        "hgvspShort": "p.Q1395Lfs*11",
                        "hgvsp": "p.Gln1395LeufsTer11",
                        "hgvsc": "ENST00000471181.2:c.4182_4183dup",
                        "proteinPosition": {
                            "start": 1395,
                            "end": 1395
                        },
                        "refSeq": "NM_007300.3",
                        "variantClassification": "Frame_Shift_Ins"
                    }
                ]
            }
        },
        {
            "variant": "13:g.32912813G>T",
            "id": "13:g.32912813G>T",
            "assembly_name": "GRCh37",
            "seq_region_name": "13",
            "start": 32912813,
            "end": 32912813,
            "allele_string": "G/T",
            "strand": 1,
            "most_severe_consequence": "stop_gained",
            "annotation_summary": {
                "variant": "13:g.32912813G>T",
                "genomicLocation": {
                    "chromosome": "13",
                    "start": 32912813,
                    "end": 32912813,
                    "referenceAllele": "G",
                    "variantAllele": "T"
                },
                "strandSign": "+",
                "variantType": "SNP",
                "assemblyName": "GRCh37",
                "canonicalTranscriptId": "ENST00000544455",
                "transcriptConsequences": [
                    {
                        "transcriptId": "ENST00000544455",
                        "codonChange": "Gag/Tag",
                        "entrezGeneId": "675",
                        "consequenceTerms": "stop_gained",
                        "hugoGeneSymbol": "BRCA2",
                        "hgvspShort": "p.E1441*",
                        "hgvsp": "p.Glu1441Ter",
                        "hgvsc": "ENST00000544455.1:c.4321G>T",
                        "proteinPosition": {
                            "start": 1441,
                            "end": 1441
                        },
                        "refSeq": "NM_000059.3",
                        "variantClassification": "Nonsense_Mutation"
                    }
                ]
            }
        },
        {
            "variant": "12:g.133214671G>C",
            "id": "12:g.133214671G>C",
            "assembly_name": "GRCh37",
            "seq_region_name": "12",
            "start": 133214671,
            "end": 133214671,
            "allele_string": "G/C",
            "strand": 1,
            "most_severe_consequence": "missense_variant",
            "annotation_summary": {
                "variant": "12:g.133214671G>C",
                "genomicLocation": {
                    "chromosome": "12",
                    "start": 133214671,
                    "end": 133214671,
                    "referenceAllele": "G",
                    "variantAllele": "C"
                },
                "strandSign": "+",
                "variantType": "SNP",
                "assemblyName": "GRCh37",
                "canonicalTranscriptId": "ENST00000320574",
                "transcriptConsequences": [
                    {
                        "transcriptId": "ENST00000320574",
                        "codonChange": "aaC/aaG",
                        "entrezGeneId": "5426",
                        "consequenceTerms": "missense_variant",
                        "hugoGeneSymbol": "POLE",
                        "hgvspShort": "p.N1869K",
                        "hgvsp": "p.Asn1869Lys",
                        "hgvsc": "ENST00000320574.5:c.5607C>G",
                        "proteinPosition": {
                            "start": 1869,
                            "end": 1869
                        },
                        "refSeq": "NM_006231.2",
                        "variantClassification": "Missense_Mutation"
                    }
                ]
            }
        },
        {
            "variant": "17:g.7577539G>A",
            "id": "17:g.7577539G>A",
            "assembly_name": "GRCh37",
            "seq_region_name": "17",
            "start": 7577539,
            "end": 7577539,
            "allele_string": "G/A",
            "strand": 1,
            "most_severe_consequence": "missense_variant",
            "annotation_summary": {
                "variant": "17:g.7577539G>A",
                "genomicLocation": {
                    "chromosome": "17",
                    "start": 7577539,
                    "end": 7577539,
                    "referenceAllele": "G",
                    "variantAllele": "A"
                },
                "strandSign": "+",
                "variantType": "SNP",
                "assemblyName": "GRCh37",
                "canonicalTranscriptId": "ENST00000269305",
                "transcriptConsequences": [
                    {
                        "transcriptId": "ENST00000269305",
                        "codonChange": "Cgg/Tgg",
                        "entrezGeneId": "7157",
                        "consequenceTerms": "missense_variant",
                        "hugoGeneSymbol": "TP53",
                        "hgvspShort": "p.R248W",
                        "hgvsp": "p.Arg248Trp",
                        "hgvsc": "ENST00000269305.4:c.742C>T",
                        "proteinPosition": {
                            "start": 248,
                            "end": 248
                        },
                        "refSeq": "NM_001126112.2",
                        "variantClassification": "Missense_Mutation"
                    }
                ]
            }
        },
        {
            "variant": "10:g.89692905G>A",
            "id": "10:g.89692905G>A",
            "assembly_name": "GRCh37",
            "seq_region_name": "10",
            "start": 89692905,
            "end": 89692905,
            "allele_string": "G/A",
            "strand": 1,
            "most_severe_consequence": "missense_variant",
            "annotation_summary": {
                "variant": "10:g.89692905G>A",
                "genomicLocation": {
                    "chromosome": "10",
                    "start": 89692905,
                    "end": 89692905,
                    "referenceAllele": "G",
                    "variantAllele": "A"
                },
                "strandSign": "+",
                "variantType": "SNP",
                "assemblyName": "GRCh37",
                "canonicalTranscriptId": "ENST00000371953",
                "transcriptConsequences": [
                    {
                        "transcriptId": "ENST00000371953",
                        "codonChange": "cGa/cAa",
                        "entrezGeneId": "5728",
                        "consequenceTerms": "missense_variant",
                        "hugoGeneSymbol": "PTEN",
                        "hgvspShort": "p.R130Q",
                        "hgvsp": "p.Arg130Gln",
                        "hgvsc": "ENST00000371953.3:c.389G>A",
                        "proteinPosition": {
                            "start": 130,
                            "end": 130
                        },
                        "refSeq": "NM_000314.4",
                        "variantClassification": "Missense_Mutation"
                    }
                ]
            }
        }
    ];


    let mutationsWithNoGenomicLocation: Mutation[];
    let mutationsWithGenomicLocation: Mutation[];

    before(() => {
        mutationsWithNoGenomicLocation =  [
            initMutation({
                gene: {
                    hugoSymbol: "AR"
                },
                proteinChange: "L729I"
            }),
            initMutation({
                gene: {
                    hugoSymbol: "AR"
                },
                proteinChange: "K222N"
            }),
            initMutation({
                gene: {
                    hugoSymbol: "BRCA1"
                },
                proteinChange: "Q1395fs"
            })
        ];

        mutationsWithGenomicLocation =  [
            initMutation({
                gene: {
                    chromosome: "X"
                },
                startPosition: 66937331,
                endPosition: 66937331,
                referenceAllele: "T",
                variantAllele: "A"
            }),
            initMutation({
                gene: {
                    chromosome: "17"
                },
                startPosition: 41242962,
                endPosition: 41242963,
                referenceAllele: "-",
                variantAllele: "GA"
            }),
            initMutation({
                gene: {
                    chromosome: "13"
                },
                startPosition: 32912813,
                endPosition: 32912813,
                referenceAllele: "G",
                variantAllele: "T"
            }),
            initMutation({
                gene: {
                    chromosome: "12"
                },
                startPosition: 133214671,
                endPosition: 133214671,
                referenceAllele: "G",
                variantAllele: "C"
            }),
            initMutation({
                gene: {
                    chromosome: "17"
                },
                startPosition: 7577539,
                endPosition: 7577539,
                referenceAllele: "G",
                variantAllele: "A"
            }),
            initMutation({
                gene: {
                    chromosome: "10"
                },
                startPosition: 89692905,
                endPosition: 89692905,
                referenceAllele: "G",
                variantAllele: "A"
            }),
        ];
    });

    describe('annotateMutations', () => {

        it("won't annotate mutation data if there are no mutations", (done) => {

            const fetchStub = sinon.stub();

            const genomeNexusClient: any = {
                fetchVariantAnnotationByGenomicLocationPOST: fetchStub
            };

            annotateMutations([], genomeNexusClient).then((data: Mutation[]) => {
                assert.equal(data.length, 0, "annotated mutation data should be empty");
                assert.isFalse(fetchStub.called, "variant annotation fetcher should NOT be called");
                done();
            });
        });

        it("won't annotate mutation data if there are no mutations with genomic coordinate information", (done) => {

            const fetchStub = sinon.stub();

            const genomeNexusClient: any = {
                fetchVariantAnnotationByGenomicLocationPOST: fetchStub
            };

            annotateMutations(_.cloneDeep(mutationsWithNoGenomicLocation), genomeNexusClient).then((data: Mutation[]) => {
                assert.deepEqual(data, mutationsWithNoGenomicLocation,
                    "annotated mutation data should be identical to the initial input");
                assert.isFalse(fetchStub.called,
                    "variant annotation fetcher should NOT be called");
                done();
            });
        });

        it("annotates mutation data when the genomic coordinate information is present", (done) => {

            const fetchStub = sinon.stub();
            fetchStub.returns(fetchStubResponse);

            const genomeNexusClient: any = {
                fetchVariantAnnotationByGenomicLocationPOST: fetchStub
            };

            annotateMutations(_.cloneDeep(mutationsWithGenomicLocation), genomeNexusClient).then((data: Mutation[]) => {
                assert.notDeepEqual(data, mutationsWithGenomicLocation,
                    "annotated mutation data should be different than the initial input");
                assert.isTrue(fetchStub.called,
                    "variant annotation fetcher should be called");

                assert.equal(data[0].gene!.hugoGeneSymbol, "AR");
                assert.isTrue(data[0].proteinChange.includes("L729I"));
                assert.isTrue(data[0].mutationType.includes("Missense"));

                assert.equal(data[1].gene!.hugoGeneSymbol, "BRCA1");
                assert.isTrue(data[1].proteinChange.includes("Q1395Lfs*11"));
                assert.isTrue(data[1].mutationType.includes("Frame_Shift_Ins"));

                assert.equal(data[2].gene!.hugoGeneSymbol, "BRCA2");
                assert.isTrue(data[2].proteinChange.includes("E1441*"));
                assert.isTrue(data[2].mutationType.includes("Nonsense"));

                assert.equal(data[3].gene!.hugoGeneSymbol, "POLE");
                assert.isTrue(data[3].proteinChange.includes("N1869K"));
                assert.isTrue(data[3].mutationType.includes("Missense"));

                assert.equal(data[4].gene!.hugoGeneSymbol, "TP53");
                assert.isTrue(data[4].proteinChange.includes("R248W"));
                assert.isTrue(data[4].mutationType.includes("Missense"));

                assert.equal(data[5].gene!.hugoGeneSymbol, "PTEN");
                assert.isTrue(data[5].proteinChange.includes("R130Q"));
                assert.isTrue(data[5].mutationType.includes("Missense"));

                done();
            });
        });
    });

    describe('resolveMissingProteinPositions', () => {

        it("resolves missing protein positions from protein change value", () => {

            const mutations: Partial<Mutation>[] = [
                {
                    proteinChange: "L729I"
                },
                {
                    proteinChange: "K222N"
                },
                {
                    aminoAcidChange: "Q1395fs"
                },
                {
                    proteinChange: "INVALID"
                }
            ];

            resolveMissingProteinPositions(mutations);

            assert.equal(mutations[0].proteinPosStart, 729,
                "proteinChange = L729I => proteinPosStart = 729");
            assert.equal(mutations[1].proteinPosStart, 222,
                "proteinChange = K222N => proteinPosStart = 222");
            assert.equal(mutations[2].proteinPosStart, 1395,
                "aminoAcidChange = Q1395fs => proteinPosStart = 1395");
            assert.isUndefined(mutations[3].proteinPosStart,
                "invalid proteinChange => proteinPosStart = undefined");
        });
    });
});
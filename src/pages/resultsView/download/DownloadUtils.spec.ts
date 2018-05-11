import {assert} from 'chai';

import {GeneticTrackDatum} from "shared/components/oncoprint/Oncoprint";
import {GenePanelData, Sample} from "shared/api/generated/CBioPortalAPI";
import {
    generateCaseAlterationData, generateDownloadData, generateGeneAlterationData, generateMutationDownloadData, generateOqlData
} from "./DownloadUtils";
import {
    AnnotatedMutation, ExtendedAlteration
} from "../ResultsViewPageStore";

describe('DownloadUtils', () => {

    const genes = [
        {
            "entrezGeneId": 5728,
            "hugoGeneSymbol": "PTEN",
            "type": "protein-coding",
            "cytoband": "10q23.31",
            "length": 87892669,
            "chromosome": "10"
        },
        {
            "entrezGeneId": 7157,
            "hugoGeneSymbol": "TP53",
            "type": "protein-coding",
            "cytoband": "17p13.1",
            "length": 19149,
            "chromosome": "17"
        },
        {
            "entrezGeneId": 1956,
            "hugoGeneSymbol": "EGFR",
            "type": "protein-coding",
            "cytoband": "7p11.2",
            "length": 188307,
            "chromosome": "7"
        }
    ];

    const samples = [{
        uniqueSampleKey: "UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3",
        uniquePatientKey: "UC0wMDAwMzc4Om1za19pbXBhY3RfMjAxNw",
        sampleType: "Primary Solid Tumor",
        sampleId: "P-0000378-T01-IM3",
        patientId: "P-0000378",
        cancerTypeId: "mixed",
        studyId: "msk_impact_2017",
    }, {
        uniqueSampleKey: "VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ",
        uniquePatientKey: "VENHQS1FRS1BMjBDOnNrY21fdGNnYQ",
        sampleType: "Metastatic",
        sampleId: "TCGA-EE-A20C-06",
        patientId: "TCGA-EE-A20C",
        cancerTypeId: "skcm",
        studyId: "skcm_tcga",
    }] as Sample[];

    const sampleDataWithNoAlteration: (ExtendedAlteration&AnnotatedMutation)[] = [];

    const mrnaDataForTCGAEEA20C = {
        oncoKbOncogenic: "",
        uniqueSampleKey: "VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ",
        uniquePatientKey: "VENHQS1FRS1BMjBDOnNrY21fdGNnYQ",
        molecularProfileId: "skcm_tcga_rna_seq_v2_mrna_median_Zscores",
        sampleId: "TCGA-EE-A20C-06",
        patientId: "TCGA-EE-A20C",
        studyId: "skcm_tcga",
        value: 2.4745,
        entrezGeneId: 5728,
        gene: {
            entrezGeneId: 5728,
            hugoGeneSymbol: "PTEN",
            type: "protein-coding",
            cytoband: "10q23.31",
            length: 87892669
        },
        molecularProfileAlterationType: "MRNA_EXPRESSION",
        alterationType: "MRNA_EXPRESSION",
        alterationSubType: "up"
    };

    const proteinDataForTCGAEEA20C = {
        oncoKbOncogenic: "",
        uniqueSampleKey: "VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ",
        uniquePatientKey: "VENHQS1FRS1BMjBDOnNrY21fdGNnYQ",
        molecularProfileId: "skcm_tcga_rppa_Zscores",
        sampleId: "TCGA-EE-A20C-06",
        patientId: "TCGA-EE-A20C",
        studyId: "skcm_tcga",
        value: 2.5406,
        entrezGeneId: 5728,
        gene: {
            entrezGeneId: 5728,
            hugoGeneSymbol: "PTEN",
            type: "protein-coding",
            cytoband: "10q23.31",
            length: 87892669
        },
        molecularProfileAlterationType: "PROTEIN_LEVEL",
        alterationType: "PROTEIN_LEVEL",
        alterationSubType: "up"
    };

    const cnaDataForTCGAEEA20C = {
        molecularProfileAlterationType: "COPY_NUMBER_ALTERATION",
        uniqueSampleKey: "VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ",
        uniquePatientKey: "VENHQS1FRS1BMjBDOnNrY21fdGNnYQ",
        molecularProfileId: "skcm_tcga_gistic",
        sampleId: "TCGA-EE-A20C-06",
        patientId: "TCGA-EE-A20C",
        studyId: "skcm_tcga",
        value: -1,
        entrezGeneId: 7157,
        gene: {
            entrezGeneId: 7157,
            hugoGeneSymbol: "TP53",
            type: "protein-coding",
            cytoband: "17p13.1",
            length: 19149
        }
    };

    const sampleDataWithBothMutationAndFusion = [
        {
            "putativeDriver": true,
            "isHotspot": true,
            "oncoKbOncogenic": "likely oncogenic",
            "simplifiedMutationType": "missense",
            "uniqueSampleKey": "UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3",
            "uniquePatientKey": "UC0wMDAwMzc4Om1za19pbXBhY3RfMjAxNw",
            "molecularProfileId": "msk_impact_2017_mutations",
            "sampleId": "P-0000378-T01-IM3",
            "patientId": "P-0000378",
            "entrezGeneId": 1956,
            "gene": {
                "entrezGeneId": 1956,
                "hugoGeneSymbol": "EGFR",
                "type": "protein-coding",
                "cytoband": "7p11.2",
                "length": 188307,
                "chromosome": "7"
            },
            "studyId": "msk_impact_2017",
            "center": "NA",
            "mutationStatus": "NA",
            "validationStatus": "NA",
            "tumorAltCount": 425,
            "tumorRefCount": 7757,
            "normalAltCount": -1,
            "normalRefCount": -1,
            "startPosition": 55233043,
            "endPosition": 55233043,
            "referenceAllele": "G",
            "proteinChange": "G598A",
            "mutationType": "Missense_Mutation",
            "functionalImpactScore": "M",
            "fisValue": 2.855,
            "linkXvar": "getma.org/?cm=var&var=hg19,7,55233043,G,C&fts=all",
            "linkPdb": "getma.org/pdb.php?prot=EGFR_HUMAN&from=482&to=681&var=G598A",
            "linkMsa": "getma.org/?cm=msa&ty=f&p=EGFR_HUMAN&rb=482&re=681&var=G598A",
            "ncbiBuild": "GRCh37",
            "variantType": "SNP",
            "keyword": "EGFR G598 missense",
            "driverFilter": "",
            "driverFilterAnnotation": "",
            "driverTiersFilter": "",
            "driverTiersFilterAnnotation": "",
            "variantAllele": "C",
            "refseqMrnaId": "NM_005228.3",
            "proteinPosStart": 598,
            "proteinPosEnd": 598,
            "molecularProfileAlterationType": "MUTATION_EXTENDED",
            "alterationType": "MUTATION_EXTENDED",
            "alterationSubType": "missense"
        },
        {
            "putativeDriver": true,
            "isHotspot": false,
            "oncoKbOncogenic": "likely oncogenic",
            "simplifiedMutationType": "fusion",
            "uniqueSampleKey": "UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3",
            "uniquePatientKey": "UC0wMDAwMzc4Om1za19pbXBhY3RfMjAxNw",
            "molecularProfileId": "msk_impact_2017_mutations",
            "sampleId": "P-0000378-T01-IM3",
            "patientId": "P-0000378",
            "entrezGeneId": 1956,
            "gene": {
                "entrezGeneId": 1956,
                "hugoGeneSymbol": "EGFR",
                "type": "protein-coding",
                "cytoband": "7p11.2",
                "length": 188307,
                "chromosome": "7"
            },
            "studyId": "msk_impact_2017",
            "center": "MSKCC-DMP",
            "mutationStatus": "NA",
            "validationStatus": "NA",
            "tumorAltCount": -1,
            "tumorRefCount": -1,
            "normalAltCount": -1,
            "normalRefCount": -1,
            "startPosition": -1,
            "endPosition": -1,
            "referenceAllele": "NA",
            "proteinChange": "EGFR-intragenic",
            "mutationType": "Fusion",
            "functionalImpactScore": "NA",
            "fisValue": -1,
            "linkXvar": "NA",
            "linkPdb": "NA",
            "linkMsa": "NA",
            "ncbiBuild": "NA",
            "variantType": "NA",
            "keyword": "EGFR EGFR-intragenic",
            "variantAllele": "NA",
            "refseqMrnaId": "NA",
            "proteinPosStart": -1,
            "proteinPosEnd": -1,
            "molecularProfileAlterationType": "MUTATION_EXTENDED",
            "alterationType": "FUSION",
            "alterationSubType": "fusion"
        },
        {
            "putativeDriver": false,
            "isHotspot": false,
            "oncoKbOncogenic": "",
            "simplifiedMutationType": "missense",
            "uniqueSampleKey": "UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3",
            "uniquePatientKey": "UC0wMDAwMzc4Om1za19pbXBhY3RfMjAxNw",
            "molecularProfileId": "msk_impact_2017_mutations",
            "sampleId": "P-0000378-T01-IM3",
            "patientId": "P-0000378",
            "entrezGeneId": 1956,
            "gene": {
                "entrezGeneId": 1956,
                "hugoGeneSymbol": "EGFR",
                "type": "protein-coding",
                "cytoband": "7p11.2",
                "length": 188307,
                "chromosome": "7"
            },
            "studyId": "msk_impact_2017",
            "center": "NA",
            "mutationStatus": "NA",
            "validationStatus": "NA",
            "tumorAltCount": 1694,
            "tumorRefCount": 3870,
            "normalAltCount": -1,
            "normalRefCount": -1,
            "startPosition": 55220325,
            "endPosition": 55220325,
            "referenceAllele": "G",
            "proteinChange": "G239C",
            "mutationType": "Missense_Mutation",
            "functionalImpactScore": "",
            "fisValue": 1.4013e-45,
            "linkXvar": "",
            "linkPdb": "",
            "linkMsa": "",
            "ncbiBuild": "GRCh37",
            "variantType": "SNP",
            "keyword": "EGFR G239 missense",
            "driverFilter": "",
            "driverFilterAnnotation": "",
            "driverTiersFilter": "",
            "driverTiersFilterAnnotation": "",
            "variantAllele": "T",
            "refseqMrnaId": "NM_005228.3",
            "proteinPosStart": 239,
            "proteinPosEnd": 239,
            "molecularProfileAlterationType": "MUTATION_EXTENDED",
            "alterationType": "MUTATION_EXTENDED",
            "alterationSubType": "missense"
        }
    ] as (ExtendedAlteration&AnnotatedMutation)[];

    const caseAggregatedDataByOQLLine = [{
        cases: {
            samples: {
                "UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": sampleDataWithBothMutationAndFusion,
                "VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": []
            }
        },
        oql: {
            gene: "EGFR",
            oql_line: "EGFR: AMP HOMDEL MUT FUSION;",
            data: sampleDataWithBothMutationAndFusion
        }
    }, {
        cases: {
            samples: {
                "UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": [],
                "VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": [mrnaDataForTCGAEEA20C, proteinDataForTCGAEEA20C]
            }
        },
        oql: {
            gene: "PTEN",
            oql_line: "PTEN: AMP HOMDEL MUT FUSION;",
            data: [mrnaDataForTCGAEEA20C, proteinDataForTCGAEEA20C]
        }
    }, {
        cases: {
            samples: {
                "UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": [],
                "VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": []
            }
        },
        oql: {
            gene: "TP53",
            oql_line: "TP53: AMP HOMDEL MUT FUSION;",
            data: []
        }
    }] as any;

    describe('generateOqlData', () => {

        it('generates empty oql data for a sample with no alteration data', () => {

            const geneticTrackDatum = {
                sample: "TCGA-BF-A1PV-01",
                study_id: "skcm_tcga",
                uid: "VENHQS1CRi1BMVBWLTAxOnNrY21fdGNnYQ",
                coverage:[],
                gene: "PTEN",
                data: sampleDataWithNoAlteration
            };

            const oqlData = generateOqlData(geneticTrackDatum);

            assert.equal(oqlData.geneSymbol, "PTEN",
                "gene symbol is correct for the sample with no alteration");
            assert.equal(oqlData.cna.length, 0,
                "cna data is empty for the sample with no alteration");
            assert.equal(oqlData.mutation.length, 0,
                "mutation data is empty for the sample with no alteration");
            assert.equal(oqlData.fusion.length, 0,
                "fusion data is empty for the sample with no alteration");
            assert.equal(oqlData.mrnaExp.length, 0,
                "mRNA expression data is empty for the sample with no alteration");
            assert.equal(oqlData.proteinLevel.length, 0,
                "protein level data is empty for the sample with no alteration");
        });


        it('generates oql data properly for samples with multiple alteration types', () => {

            const geneticTrackDatum = {
                sample: "TCGA-EE-A20C-06",
                study_id: "skcm_tcga",
                uid: "VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ",
                coverage:[],
                gene: "PTEN",
                data: [mrnaDataForTCGAEEA20C, proteinDataForTCGAEEA20C] as any[],
                disp_mrna: "up",
                disp_prot: "up"
            } as GeneticTrackDatum;

            const oqlData = generateOqlData(geneticTrackDatum);

            assert.equal(oqlData.geneSymbol, "PTEN",
                "gene symbol is correct for the sample with mrna and protein data only");
            assert.equal(oqlData.cna.length, 0,
                "cna data is empty for the sample with mrna and protein data only");
            assert.equal(oqlData.mutation.length, 0,
                "mutation data is empty for the sample with mrna and protein data only");
            assert.equal(oqlData.fusion.length, 0,
                "fusion data is empty for the sample with mrna and protein data only");

            assert.equal(oqlData.mrnaExp.length, 1,
                "mRNA expression data exists for the sample with mrna and protein data only");
            assert.equal(oqlData.proteinLevel.length, 1,
                "protein level data exists for the sample with mrna and protein data only");

            assert.deepEqual(oqlData.mrnaExp, [{type: "UP", value: 2.4745}],
                "mRNA expression data is correct for the sample with mrna and protein data only");
            assert.deepEqual(oqlData.proteinLevel, [{type: "UP", value: 2.5406}],
                "protein level data is correct for the sample with mrna and protein data only");
        });

        it('generates oql data properly for samples with multiple mutations/fusions', () => {

            const geneticTrackDatum = {
                sample: "P-0000378-T01-IM3",
                study_id: "msk_impact_2017",
                uid: "UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3",
                coverage:[],
                gene: "EGFR",
                data: sampleDataWithBothMutationAndFusion,
                disp_fusion: true,
                disp_cna: "amp",
                disp_mut: "missense_rec"
            } as GeneticTrackDatum;

            const oqlData = generateOqlData(geneticTrackDatum);

            assert.equal(oqlData.geneSymbol, "EGFR",
                "gene symbol is correct for the sample with both mutation and fusion data");
            assert.deepEqual(oqlData.mrnaExp, [],
                "mRNA expression data is empty for the sample with mutation and fusion data");
            assert.deepEqual(oqlData.proteinLevel, [],
                "protein level data is empty for the sample with mutation and fusion data");
            assert.deepEqual(oqlData.cna, [],
                "CNA data is empty for the sample with mutation and fusion data");
            assert.deepEqual(oqlData.fusion, ["EGFR-intragenic"],
                "fusion data is correct for the sample with mutation and fusion data");
            assert.deepEqual(oqlData.mutation, ["G598A", "G239C"],
                "mutation data is correct for the sample with mutation and fusion data");
        });
    });

    describe('generateGeneAlterationData', () => {
        it('returns empty list in case of empty input', () => {
            const sampleKeys = {};

            const caseAlterationData = generateGeneAlterationData(caseAggregatedDataByOQLLine, sampleKeys);

            assert.equal(caseAlterationData.length, 0,
                "case alteration data should be empty");
        });

        it('generates gene alteration data for multiple samples', () => {

            const sampleKeys = {
                PTEN: [
                    "UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3",
                    "VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ"
                ],
                TP53: [
                    "UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3",
                    "VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ"
                ],
                EGFR: [
                    "UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3",
                    "VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ"
                ]
            };

            const caseAlterationData = generateGeneAlterationData(caseAggregatedDataByOQLLine, sampleKeys);

            assert.equal(caseAlterationData[0].oqlLine, "EGFR: AMP HOMDEL MUT FUSION;",
                "OQL line is correct for the gene EGFR");
            assert.equal(caseAlterationData[0].altered, 1,
                "number of altered samples is correct for the gene EGFR");
            assert.equal(caseAlterationData[0].percentAltered, "50%",
                "alteration percent is correct for the gene EGFR");

            assert.equal(caseAlterationData[1].oqlLine, "PTEN: AMP HOMDEL MUT FUSION;",
                "OQL line is correct for the gene PTEN");
            assert.equal(caseAlterationData[1].altered, 1,
                "number of altered samples is correct for the gene PTEN");
            assert.equal(caseAlterationData[1].percentAltered, "50%",
                "alteration percent is correct for the gene PTEN");

            assert.equal(caseAlterationData[2].oqlLine, "TP53: AMP HOMDEL MUT FUSION;",
                "OQL line is correct for the gene TP53");
            assert.equal(caseAlterationData[2].altered, 0,
                "number of altered samples is correct for the gene TP53");
            assert.equal(caseAlterationData[2].percentAltered, "0%",
                "alteration percent is correct for the gene TP53");
        });
    });

    describe('generateMutationDownloadData', () => {

        it('generates download data for mutated samples',() => {

            const sampleAlterationDataByGene = {
                "EGFR_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": [
                    ...sampleDataWithBothMutationAndFusion
                ],
                "PTEN_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": [],
                "TP53_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": [],
                "EGFR_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": [],
                "PTEN_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": [],
                "TP53_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": []
            };

            const downloadData = generateMutationDownloadData(sampleAlterationDataByGene, samples, genes);

            const expectedResult = [
                ["STUDY_ID", "SAMPLE_ID", "PTEN", "TP53", "EGFR"],
                ["msk_impact_2017", "P-0000378-T01-IM3", "NA", "NA", "G598A EGFR-intragenic G239C"],
                ["skcm_tcga", "TCGA-EE-A20C-06", "NA", "NA", "NA"]
            ];

            assert.deepEqual(downloadData, expectedResult,
                "mutation download data is correctly generated");
        });

    });

    describe('generateDownloadData', () => {

        it('generates download data for mRNA expression alterations',() => {

            const sampleAlterationDataByGene = {
                "EGFR_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": [],
                "PTEN_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": [],
                "TP53_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": [],
                "EGFR_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": [],
                "PTEN_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": [
                    mrnaDataForTCGAEEA20C as ExtendedAlteration&AnnotatedMutation
                ],
                "TP53_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": []
            };

            const downloadData = generateDownloadData(sampleAlterationDataByGene, samples, genes);

            const expectedResult = [
                ["STUDY_ID", "SAMPLE_ID", "PTEN", "TP53", "EGFR"],
                ["msk_impact_2017", "P-0000378-T01-IM3", "NA", "NA", "NA"],
                ["skcm_tcga", "TCGA-EE-A20C-06", "2.4745", "NA", "NA"]
            ];

            assert.deepEqual(downloadData, expectedResult,
                "mRNA download data is correctly generated");
        });

        it('generates download data for protein expression alterations',() => {

            const sampleAlterationDataByGene = {
                "EGFR_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": [],
                "PTEN_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": [],
                "TP53_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": [],
                "EGFR_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": [],
                "PTEN_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": [
                    proteinDataForTCGAEEA20C as ExtendedAlteration&AnnotatedMutation
                ],
                "TP53_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": []
            };

            const downloadData = generateDownloadData(sampleAlterationDataByGene, samples, genes);

            const expectedResult = [
                ["STUDY_ID", "SAMPLE_ID", "PTEN", "TP53", "EGFR"],
                ["msk_impact_2017", "P-0000378-T01-IM3", "NA", "NA", "NA"],
                ["skcm_tcga", "TCGA-EE-A20C-06", "2.5406", "NA", "NA"]
            ];

            assert.deepEqual(downloadData, expectedResult,
                "protein download data is correctly generated");
        });

        it('generates download data for copy number altered samples',() => {

            const sampleAlterationDataByGene = {
                "EGFR_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": [],
                "PTEN_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": [],
                "TP53_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": [],
                "EGFR_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": [],
                "PTEN_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": [],
                "TP53_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": [
                    cnaDataForTCGAEEA20C as ExtendedAlteration&AnnotatedMutation
                ]
            };

            const downloadData = generateDownloadData(sampleAlterationDataByGene, samples, genes);

            const expectedResult = [
                ["STUDY_ID", "SAMPLE_ID", "PTEN", "TP53", "EGFR"],
                ["msk_impact_2017", "P-0000378-T01-IM3", "NA", "NA", "NA"],
                ["skcm_tcga", "TCGA-EE-A20C-06", "NA", "-1", "NA"]
            ];

            assert.deepEqual(downloadData, expectedResult,
                "CNA download data is correctly generated");
        });
    });

    describe('generateCaseAlterationData', () => {
        it('properly handles not sequenced genes when generating case alteration data', () => {
            const genePanelInformation = {
                samples: {
                    "UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": {
                        "byGene": {},
                        "allGenes": [],
                        "notProfiledByGene":{},
                        "notProfiledAllGenes":[]
                    },
                    "VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": {
                        "byGene": {},
                        "allGenes": [{molecularProfileId:"AsdfasD", profiled:true} as GenePanelData],
                        "notProfiledByGene":{},
                        "notProfiledAllGenes":[]
                    }
                },
                patients: {}
            };

            const geneAlterationData = {
                "EGFR": {
                    gene: "EGFR",
                    oqlLine: "EGFR: AMP HOMDEL MUT FUSION;",
                    sequenced: 0,
                    altered: 0,
                    percentAltered: "N/S"
                }
            };

            const caseAlterationData = generateCaseAlterationData(caseAggregatedDataByOQLLine,
                genePanelInformation,
                samples,
                geneAlterationData);

            assert.isFalse(caseAlterationData[0].oqlData["EGFR: AMP HOMDEL MUT FUSION;"].sequenced,
                "cases with the gene EGFR should be marked as not sequenced");

            assert.isTrue(caseAlterationData[1].oqlData["PTEN: AMP HOMDEL MUT FUSION;"].sequenced,
                "cases with the gene other than EGFR should be marked as sequenced");
        });


        it('generates case alteration data for multiple samples',() => {

            const genePanelInformation = {
                samples: {
                    "UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3": {
                        "byGene": {},
                        "allGenes": [{molecularProfileId:"AsdfasD", profiled:true} as GenePanelData],
                        "notProfiledByGene":{},
                        "notProfiledAllGenes":[]
                    },
                    "VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ": {
                        "byGene": {},
                        "allGenes": [{molecularProfileId:"AsdfasD", profiled:true} as GenePanelData],
                        "notProfiledByGene":{},
                        "notProfiledAllGenes":[]
                    }
                },
                patients: {}
            };


            const caseAlterationData = generateCaseAlterationData(caseAggregatedDataByOQLLine, genePanelInformation, samples);

            assert.equal(caseAlterationData.length, 2,
                "case alteration data has correct size");

            assert.equal(caseAlterationData[0].sampleId, "P-0000378-T01-IM3",
                "sample id is correct for the sample key UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3");
            assert.equal(caseAlterationData[0].studyId, "msk_impact_2017",
                "study id is correct for the sample key UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3");
            assert.isTrue(caseAlterationData[0].altered,
                "sample UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3 is altered");
            assert.deepEqual(caseAlterationData[0].oqlData["EGFR: AMP HOMDEL MUT FUSION;"].mutation,
                ["G598A", "G239C"],
                "mutation data is correct for the sample key UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3");
            assert.deepEqual(caseAlterationData[0].oqlData["EGFR: AMP HOMDEL MUT FUSION;"].fusion,
                ["EGFR-intragenic"],
                "fusion data is correct for the sample key UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3");

            assert.equal(caseAlterationData[1].sampleId, "TCGA-EE-A20C-06",
                "sample id is correct for the sample key VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ");
            assert.equal(caseAlterationData[1].studyId, "skcm_tcga",
                "study id is correct for the sample key VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ");
            assert.isTrue(caseAlterationData[1].altered,
                "sample VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ is altered");
            assert.deepEqual(caseAlterationData[1].oqlData["PTEN: AMP HOMDEL MUT FUSION;"].mrnaExp,
                [{type: 'UP', value: 2.4745}],
                "mRNA data is correct for the sample key VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ");
            assert.deepEqual(caseAlterationData[1].oqlData["PTEN: AMP HOMDEL MUT FUSION;"].proteinLevel,
                [{type: 'UP', value: 2.5406}],
                "protein data is correct for the sample key VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ");
        });
    });
});

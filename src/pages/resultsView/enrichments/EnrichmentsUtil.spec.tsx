import { assert } from 'chai';
import { calculateAlterationTendency, calculateExpressionTendency,
    formatPercentage, getAlterationScatterData, getExpressionScatterData,
    getAlterationRowData, getExpressionRowData, getFilteredData, getBarChartTooltipContent, getBoxPlotScatterData, 
    getDownloadContent, getAlterationsTooltipContent, shortenGenesLabel, getBoxPlotModels, getFilteredDataByGroups, getGroupColumns, getEnrichmentBarPlotData, getGeneListOptions
} from "./EnrichmentsUtil";
import expect from 'expect';
import expectJSX from 'expect-jsx';
import * as _ from "lodash";

expect.extend(expectJSX);

const exampleAlterationEnrichments = [
    {
        "entrezGeneId": 1956,
        "hugoGeneSymbol": "EGFR",
        "cytoband": "7p11.2",
        "counts":[{
            "alteredCount": 3,
            "name": "altered group",
            "profiledCount": 4
        },{
            "alteredCount": 0,
            "name": "unaltered group",
            "profiledCount": 4
        }],
        "pValue": 0.00003645111904935468,
        "qValue": 0.2521323904643863
    },
    {
        "entrezGeneId": 6468,
        "hugoGeneSymbol": "FBXW4",
        "cytoband": "10q24.32",
        "counts":[{
            "alteredCount": 2,
            "name": "altered group",
            "profiledCount": 4
        },{
            "alteredCount": 0,
            "name": "unaltered group",
            "profiledCount": 4
        }],
        "pValue": 0.0015673981191222392,
        "qValue": 0.9385345997286061
    }, 
    {
        "entrezGeneId": 23066,
        "hugoGeneSymbol": "CAND2",
        "cytoband": "3p25.2",
        "counts":[{
            "alteredCount": 2,
            "name": "altered group",
            "profiledCount": 4
        },{
            "alteredCount": 0,
            "name": "unaltered group",
            "profiledCount": 4
        }],
        "pValue": 0.0015673981191222392,
        "qValue": 0.9385345997286061
    }
];

const exampleAlterationEnrichmentRowData = [
    {
        "checked": true,
        "disabled": true,
        "entrezGeneId": 1956,
        "hugoGeneSymbol": "EGFR",
        "cytoband": "7p11.2",
        "groupsSet": {
            "altered group": {
                "name": "altered group",
                "alteredCount": 3,
                "profiledCount": 4,
                "alteredPercentage": 75
            },
            "unaltered group": {
                "name": "unaltered group",
                "alteredCount": 0,
                "profiledCount": 4,
                "alteredPercentage": 0
            }
        },
        "logRatio": Infinity,
        "pValue": 0.00003645111904935468,
        "qValue": 0.2521323904643863,
        "value":undefined
    },
    {
        "checked": false,
        "disabled": false,
        "entrezGeneId": 6468,
        "hugoGeneSymbol": "FBXW4",
        "cytoband": "10q24.32",
        "groupsSet": {
            "altered group": {
                "name":"altered group",
                "alteredCount": 2,
                "profiledCount": 4,
                "alteredPercentage": 50
            },
            "unaltered group": {
                "name":"unaltered group",
                "alteredCount": 0,
                "profiledCount": 4,
                "alteredPercentage": 0
            }
        },
        "logRatio": Infinity,
        "pValue": 0.0015673981191222392,
        "qValue": 0.9385345997286061,
        "value":undefined
    }, 
    {
        "checked": false,
        "disabled": false,
        "entrezGeneId": 23066,
        "hugoGeneSymbol": "CAND2",
        "cytoband": "3p25.2",
        "groupsSet": {
            "altered group": {
                "name":"altered group",
                "alteredCount": 2,
                "profiledCount": 4,
                "alteredPercentage": 50
            },
            "unaltered group": {
                "name":"unaltered group",
                "alteredCount": 0,
                "profiledCount": 4,
                "alteredPercentage": 0
            }
        },
        "logRatio": Infinity,
        "pValue": 0.0015673981191222392,
        "qValue": 0.9385345997286061,
        "value":undefined
    }
];

const exampleExpressionEnrichments = [
    {
        "entrezGeneId": 25979,
        "hugoGeneSymbol": "DHRS7B",
        "cytoband": "17p11.2",
        "meanExpressionInAlteredGroup": 8.797111512335256,
        "meanExpressionInUnalteredGroup": 9.548546748530768,
        "standardDeviationInAlteredGroup": 0.09305770504332485,
        "standardDeviationInUnalteredGroup": 0.5899774772149077,
        "pValue": 1.9359580614715825E-9,
        "qValue": 0.000024032306741578182
    }, 
    {
        "entrezGeneId": 5774,
        "hugoGeneSymbol": "PTPN3",
        "cytoband": "9q31.3",
        "meanExpressionInAlteredGroup": 8.973330136818843,
        "meanExpressionInUnalteredGroup": 7.599637956820568,
        "standardDeviationInAlteredGroup": 0.15386396864659846,
        "standardDeviationInUnalteredGroup": 1.5212548411382572,
        "pValue": 3.698700537372556E-9,
        "qValue": 0.000024032306741578182
    }, 
    {
        "entrezGeneId": 2049,
        "hugoGeneSymbol": "EPHB3",
        "cytoband": "3q27.1",
        "meanExpressionInAlteredGroup": 8.082947701098236,
        "meanExpressionInUnalteredGroup": 5.430662108616908,
        "standardDeviationInAlteredGroup": 0.33113816397794055,
        "standardDeviationInUnalteredGroup": 1.8406977746799924,
        "pValue": 5.631839749745262E-9,
        "qValue": 0.000024395252515979897
    }
];

const exampleExpressionEnrichmentRowData = [
    {
        "checked": false,
        "disabled": false,
        "entrezGeneId": 25979,
        "hugoGeneSymbol": "DHRS7B",
        "cytoband": "17p11.2",
        "meanExpressionInAlteredGroup": 8.797111512335256,
        "meanExpressionInUnalteredGroup": 9.548546748530768,
        "standardDeviationInAlteredGroup": 0.09305770504332485,
        "standardDeviationInUnalteredGroup": 0.5899774772149077,
        "logRatio": -0.7514352361955119,
        "pValue": 1.9359580614715825E-9,
        "qValue": 0.000024032306741578182
    }, 
    {
        "checked": false,
        "disabled": false,
        "entrezGeneId": 5774,
        "hugoGeneSymbol": "PTPN3",
        "cytoband": "9q31.3",
        "meanExpressionInAlteredGroup": 8.973330136818843,
        "meanExpressionInUnalteredGroup": 7.599637956820568,
        "standardDeviationInAlteredGroup": 0.15386396864659846,
        "standardDeviationInUnalteredGroup": 1.5212548411382572,
        "logRatio": 1.373692179998275,
        "pValue": 3.698700537372556E-9,
        "qValue": 0.000024032306741578182
    }, 
    {
        "checked": false,
        "disabled": false,
        "entrezGeneId": 2049,
        "hugoGeneSymbol": "EPHB3",
        "cytoband": "3q27.1",
        "meanExpressionInAlteredGroup": 8.082947701098236,
        "meanExpressionInUnalteredGroup": 5.430662108616908,
        "standardDeviationInAlteredGroup": 0.33113816397794055,
        "standardDeviationInUnalteredGroup": 1.8406977746799924,
        "logRatio": 2.652285592481328,
        "pValue": 5.631839749745262E-9,
        "qValue": 0.000024395252515979897
    }
];

const exampleAlterations = [
    {
        alterationSubType: "missense",
        alterationType: "MUTATION_EXTENDED",
        center: "hgsc.bcm.edu;broad.mit.edu;ucsc.edu;bcgsc.ca;mdanderson.org",
        driverFilter: "",
        driverFilterAnnotation: "",
        driverTiersFilter: "",
        driverTiersFilterAnnotation: "",
        endPosition: 55224349,
        entrezGeneId: 1956,
        fisValue: 1.4013e-45,
        functionalImpactScore: "",
        gene: {
            entrezGeneId: 1956,
            hugoGeneSymbol: "EGFR",
            type: "protein-coding",
            cytoband: "7p11.2",
            length: 188307,
            chromosome: "7"
        },
        keyword: "EGFR R377 missense",
        linkMsa: "",
        linkPdb: "",
        linkXvar: "",
        molecularProfileAlterationType: "MUTATION_EXTENDED",
        molecularProfileId: "acc_tcga_mutations",
        mutationStatus: "Somatic",
        mutationType: "Missense_Mutation",
        ncbiBuild: "GRCh37",
        normalAltCount: 0,
        normalRefCount: 110,
        patientId: "TCGA-OR-A5K0",
        proteinChange: "R377K",
        proteinPosEnd: 377,
        proteinPosStart: 377,
        referenceAllele: "G",
        refseqMrnaId: "NM_005228.3",
        sampleId: "TCGA-OR-A5K0-01",
        startPosition: 55224349,
        studyId: "acc_tcga",
        tumorAltCount: 66,
        tumorRefCount: 53,
        uniquePatientKey: "VENHQS1PUi1BNUswOmFjY190Y2dh",
        uniqueSampleKey: "VENHQS1PUi1BNUswLTAxOmFjY190Y2dh",
        validationStatus: "Untested",
        variantAllele: "A",
        variantType: "SNP"
    },
    {
        alterationSubType: "amp",
        alterationType: "COPY_NUMBER_ALTERATION",
        entrezGeneId: 1956,
        gene: {
            entrezGeneId: 1956,
            hugoGeneSymbol: "EGFR",
            type: "protein-coding",
            cytoband: "7p11.2",
            length: 188307
        },
        molecularProfileAlterationType: "COPY_NUMBER_ALTERATION",
        molecularProfileId: "acc_tcga_gistic",
        patientId: "TCGA-OR-A5LO",
        sampleId: "TCGA-OR-A5LO-01",
        studyId: "acc_tcga",
        uniquePatientKey: "VENHQS1PUi1BNUxPOmFjY190Y2dh",
        uniqueSampleKey: "VENHQS1PUi1BNUxPLTAxOmFjY190Y2dh",
        value: 2
    }
]

const exampleBoxPlotScatterData = [
    {
        x: 1.922684807165747, 
        y: 9.940678152790728, 
        sampleId: "TCGA-OR-A5J1-01", 
        studyId: "acc_tcga", 
        alterations: ""
    },
    {
        x: 2.0781361505168783, 
        y: 8.34481740339671, 
        sampleId: "TCGA-OR-A5J2-01", 
        studyId: "acc_tcga", 
        alterations: ""
    },
    {
        x: 1.8867908893279546, 
        y: 9.660310790006957, 
        sampleId: "TCGA-OR-A5J3-01", 
        studyId: "acc_tcga", 
        alterations: ""
    }
]

const exampleMolecularData = [
    {
        entrezGeneId: 25979,
        gene: {
            entrezGeneId: 25979,
            hugoGeneSymbol: "DHRS7B",
            type: "protein-coding",
            cytoband: "17p11.2",
            length: 68604,
            chromosome: "17"
        },
        molecularProfileId:"acc_tcga_rna_seq_v2_mrna",
        patientId:"TCGA-OR-A5J1",
        sampleId:"TCGA-OR-A5J1-01",
        studyId:"acc_tcga",
        uniquePatientKey:"VENHQS1PUi1BNUoxOmFjY190Y2dh",
        uniqueSampleKey:"VENHQS1PUi1BNUoxLTAxOmFjY190Y2dh",
        value:981.7483
    },
    {
        entrezGeneId:25979,
        gene: {
            entrezGeneId: 25979,
            hugoGeneSymbol: "DHRS7B",
            type: "protein-coding",
            cytoband: "17p11.2",
            length: 68604,
            chromosome: "17"
        },
        molecularProfileId:"acc_tcga_rna_seq_v2_mrna",
        patientId:"TCGA-OR-A5J2",
        sampleId:"TCGA-OR-A5J2-01",
        studyId:"acc_tcga",
        uniquePatientKey:"VENHQS1PUi1BNUoyOmFjY190Y2dh",
        uniqueSampleKey:"VENHQS1PUi1BNUoyLTAxOmFjY190Y2dh",
        value:324.1175
    },
    {
        entrezGeneId:25979,
        gene: {
            entrezGeneId: 25979,
            hugoGeneSymbol: "DHRS7B",
            type: "protein-coding",
            cytoband: "17p11.2",
            length: 68604,
            chromosome: "17"
        },
        molecularProfileId:"acc_tcga_rna_seq_v2_mrna",
        patientId:"TCGA-OR-A5J3",
        sampleId:"TCGA-OR-A5J3-01",
        studyId:"acc_tcga",
        uniquePatientKey:"VENHQS1PUi1BNUozOmFjY190Y2dh",
        uniqueSampleKey:"VENHQS1PUi1BNUozLTAxOmFjY190Y2dh",
        value:808.1766
    }
]

describe("EnrichmentsUtil", () => {
    describe("#calculateAlterationTendency()", () => {
        it("returns Co-occurrence for 5", () => {
            assert.equal(calculateAlterationTendency(5), "Co-occurrence");
        });

        it("returns Mutual exclusivity for 0", () => {
            assert.equal(calculateAlterationTendency(0), "Mutual exclusivity");
        });

        it("returns Mutual exclusivity for -3", () => {
            assert.equal(calculateAlterationTendency(-3), "Mutual exclusivity");
        });
    });

    describe("#calculateExpressionTendency()", () => {
        it("returns Over-expressed for 3", () => {
            assert.equal(calculateExpressionTendency(3), "Over-expressed");
        });

        it("returns Under-expressed for 0", () => {
            assert.equal(calculateExpressionTendency(0), "Under-expressed");
        });

        it("returns Under-expressed for -7", () => {
            assert.equal(calculateExpressionTendency(-7), "Under-expressed");
        });
    });

    describe("#formatPercentage()", () => {
        it("returns 3 (75.00%) for altered count 3 and profiled count 4", () => {
            assert.equal(formatPercentage("altered group", {
                "groupsSet": {
                    "altered group": {
                        "name": "altered group",
                        "alteredCount": 3,
                        "alteredPercentage": 75
                    }
                }
            } as any), "3 (75.00%)");
        });

        it("returns 1 (1.00%) for altered count 1 and profiled count 100", () => {
            assert.equal(formatPercentage("altered group", {
                "groupsSet": {
                    "altered group": {
                        "name": "altered group",
                        "alteredCount": 1,
                        "alteredPercentage": 1
                    }
                }
            } as any), "1 (1.00%)");
        });
    });

    describe("#getAlterationScatterData()", () => {
        it("returns empty array for empty array", () => {
            assert.deepEqual(getAlterationScatterData([], []), []);
        });

        it("returns correct scatter data", () => {
            assert.deepEqual(getAlterationScatterData(exampleAlterationEnrichmentRowData as any, ["EGFR"]), [
                {x: 10, y: 2.804820678721167, hugoGeneSymbol: "FBXW4", logRatio: Infinity, pValue:0.0015673981191222392, qValue: 0.9385345997286061, hovered: false},
                {x: 10, y: 2.804820678721167, hugoGeneSymbol: "CAND2", logRatio: Infinity, pValue:0.0015673981191222392, qValue: 0.9385345997286061, hovered: false},
            ]);
        });
    });

    describe("#getExpressionScatterData()", () => {
        it("returns empty array for empty array", () => {
            assert.deepEqual(getExpressionScatterData([], []), []);
        });

        it("returns correct scatter data", () => {
            assert.deepEqual(getExpressionScatterData(exampleExpressionEnrichmentRowData, ["EGFR"]), [
                {x: -0.7514352361955119, y: 8.713104055017682, hugoGeneSymbol: "DHRS7B", entrezGeneId: 25979, 
                    logRatio: -0.7514352361955119, pValue: 1.9359580614715825E-9, qValue: 0.000024032306741578182, hovered: false},
                {x: 1.373692179998275, y: 8.431950829601448, hugoGeneSymbol: "PTPN3", entrezGeneId: 5774, 
                    logRatio: 1.373692179998275, pValue: 3.698700537372556E-9, qValue: 0.000024032306741578182, hovered: false},
                {x: 2.652285592481328, y: 8.249349711250797, hugoGeneSymbol: "EPHB3", entrezGeneId: 2049,
                    logRatio: 2.652285592481328, pValue: 5.631839749745262E-9, qValue: 0.000024395252515979897, hovered: false}
            ]);
        });
    });

    describe("#getAlterationRowData()", () => {
        it("returns empty array for empty array", () => {
            assert.deepEqual(getAlterationRowData([], [], false, "", ""), []);
        });

        it("returns correct row data", () => {
            assert.deepEqual(getAlterationRowData(exampleAlterationEnrichments, ["EGFR"], true, "altered group", "unaltered group"), exampleAlterationEnrichmentRowData as any);
        });
    });

    describe("#getExpressionRowData()", () => {
        it("returns empty array for empty array", () => {
            assert.deepEqual(getExpressionRowData([], ["EGFR"]), []);
        });

        it("returns correct row data", () => {
            assert.deepEqual(getExpressionRowData(exampleExpressionEnrichments, ["EGFR"]), exampleExpressionEnrichmentRowData);
        });
    });

    describe("#getFilteredData()", () => {
        it("returns correct filtered data", () => {
            assert.deepEqual(getFilteredData(exampleExpressionEnrichmentRowData as any, true, true, false, null),
                exampleExpressionEnrichmentRowData);

            assert.deepEqual(getFilteredData(exampleExpressionEnrichmentRowData as any , true, false, true, null), [
                {
                    "checked": false,
                    "disabled": false,
                    "entrezGeneId": 25979,
                    "hugoGeneSymbol": "DHRS7B",
                    "cytoband": "17p11.2",
                    "meanExpressionInAlteredGroup": 8.797111512335256,
                    "meanExpressionInUnalteredGroup": 9.548546748530768,
                    "standardDeviationInAlteredGroup": 0.09305770504332485,
                    "standardDeviationInUnalteredGroup": 0.5899774772149077,
                    "logRatio": -0.7514352361955119,
                    "pValue": 1.9359580614715825E-9,
                    "qValue": 0.000024032306741578182
                }
            ]);

            assert.deepEqual(getFilteredData(exampleExpressionEnrichmentRowData as any, false, true, false, ["DHRS7B", "PTPN3"]), [
                {
                    "checked": false,
                    "disabled": false,
                    "entrezGeneId": 5774,
                    "hugoGeneSymbol": "PTPN3",
                    "cytoband": "9q31.3",
                    "meanExpressionInAlteredGroup": 8.973330136818843,
                    "meanExpressionInUnalteredGroup": 7.599637956820568,
                    "standardDeviationInAlteredGroup": 0.15386396864659846,
                    "standardDeviationInUnalteredGroup": 1.5212548411382572,
                    "logRatio": 1.373692179998275,
                    "pValue": 3.698700537372556E-9,
                    "qValue": 0.000024032306741578182
                }
            ]);
        });
    });


    describe("#getFilteredDataByGroups()", () => {
        it("returns correct filtered data", () => {
            assert.deepEqual(getFilteredDataByGroups(exampleAlterationEnrichmentRowData as any, ["altered group", "unaltered group"], false, null),
            exampleAlterationEnrichmentRowData);

            assert.deepEqual(getFilteredDataByGroups(exampleAlterationEnrichmentRowData as any , ["unaltered group"], true, null), []);

            assert.deepEqual(getFilteredDataByGroups(exampleAlterationEnrichmentRowData as any, ["altered group"], false, ["FBXW4"]), [
                {
                    "checked": false,
                    "disabled": false,
                    "entrezGeneId": 6468,
                    "hugoGeneSymbol": "FBXW4",
                    "cytoband": "10q24.32",
                    "groupsSet": {
                        "altered group": {
                            "name":"altered group",
                            "alteredCount": 2,
                            "profiledCount": 4,
                            "alteredPercentage": 50
                        },
                        "unaltered group": {
                            "name":"unaltered group",
                            "alteredCount": 0,
                            "profiledCount": 4,
                            "alteredPercentage": 0
                        }
                    },
                    "logRatio": Infinity,
                    "pValue": 0.0015673981191222392,
                    "qValue": 0.9385345997286061,
                    "value":undefined
                }
            ]);
        });
    });

    describe("#getBarChartTooltipContent()", () => {
        it("returns correct tooltip content", () => {
            const exampleTooltipModel1 = {
                datum: {
                    x: 2,
                    y: 1,
                    index: 0
                }
            };
            assert.equal(getBarChartTooltipContent(exampleTooltipModel1, "EGFR"), "Query Genes Altered: 1");

            const exampleTooltipModel2 = {
                datum: {
                    x: 2,
                    y: 5,
                    index: 1
                }
            };
            assert.equal(getBarChartTooltipContent(exampleTooltipModel2, "EGFR"), "Query Genes Unaltered: 5");

            const exampleTooltipModel3 = {
                datum: {
                    x: 4,
                    y: 1,
                    index: 0
                }
            };
            assert.equal(getBarChartTooltipContent(exampleTooltipModel3, "EGFR"), "Query Genes Altered, EGFR Unaltered: 1");

            const exampleTooltipModel4 = {
                datum: {
                    x: 1,
                    y: 1,
                    index: 1
                }
            };
            assert.equal(getBarChartTooltipContent(exampleTooltipModel4, "EGFR"), "Query Genes Altered, EGFR Altered: 1");

            const exampleTooltipModel5 = {
                datum: {
                    x: 3,
                    y: 3,
                    index: 2
                }
            };
            assert.equal(getBarChartTooltipContent(exampleTooltipModel5, "EGFR"), "Query Genes Unaltered, EGFR Altered: 3");

            const exampleTooltipModel6 = {
                datum: {
                    x: 4,
                    y: 4,
                    index: 3
                }
            };
            assert.equal(getBarChartTooltipContent(exampleTooltipModel6, "EGFR"), "Query Genes Unaltered, EGFR Unaltered: 4");
        });
    });

    describe("#getDownloadContent()", () => {
        it("returns correct download content", () => {
            assert.equal(getDownloadContent(exampleBoxPlotScatterData, "EGFR", "acc_tcga_rna_seq_v2_mrna"), "Sample ID\tEGFR, " + 
            "acc_tcga_rna_seq_v2_mrna\tAlteration\nTCGA-OR-A5J1-01\t9.940678152790728\t\nTCGA-OR-A5J2-01\t8.34481740339671\t\n" + 
            "TCGA-OR-A5J3-01\t9.660310790006957\t");
        });
    });

    describe("#getAlterationsTooltipContent()", () => {
        it("returns correct tooltip content", () => {
            assert.equal(getAlterationsTooltipContent(exampleAlterations), "EGFR: MUT; AMP; ");
        });
    });

    describe("#shortenGenesLabel()", () => {
        it("returns EGFR KRAS for EGFR,KRAS and 2", () => {
            assert.equal(shortenGenesLabel(["EGFR", "KRAS"], 2), "EGFR KRAS");
        });

        it("returns EGFR KRAS… for EGFR,KRAS,TP53 and 2", () => {
            assert.equal(shortenGenesLabel(["EGFR", "KRAS", "TP53"], 2), "EGFR KRAS…");
        });
    });

    describe("#getBoxPlotModels()", () => {
        it("returns correct boxplot model", () => {
            assert.deepEqual(getBoxPlotModels(exampleBoxPlotScatterData.concat([
                {
                    x: 1, 
                    y: 5, 
                    sampleId: "TCGA-OR-A5F1-01", 
                    studyId: "acc_tcga", 
                    alterations: ""
                },
                {
                    x: 1, 
                    y: 4, 
                    sampleId: "TCGA-OR-A5O1-01", 
                    studyId: "acc_tcga", 
                    alterations: ""
                },
                {
                    x: 1, 
                    y: 7, 
                    sampleId: "TCGA-OR-A5Q1-01", 
                    studyId: "acc_tcga", 
                    alterations: ""
                }
            ])), [
                {
                    q1: 4,
                    q2: 5,
                    q3: 5,
                    IQR: 1,
                    median: 5,
                    whiskerUpper: 6.5,
                    whiskerLower: 4,
                    max: 6.5,
                    min: 4,
                    outliersUpper: {
                        outliers: [],
                        suspectedOutliers: [7]
                    },
                    outliersLower: {
                        outliers: [],
                        suspectedOutliers: []
                    },
                    x: 1
                }, 
                {
                    q1: 8.34481740339671,
                    q2: 9.660310790006957,
                    q3: 9.660310790006957,
                    IQR: 1.315493386610246,
                    median: 9.660310790006957,
                    whiskerUpper: 9.940678152790728,
                    whiskerLower: 8.34481740339671,
                    max: 9.940678152790728,
                    min: 8.34481740339671,
                    outliersUpper: {
                        outliers: [],
                        suspectedOutliers: []
                    },
                    outliersLower: {
                        outliers: [],
                        suspectedOutliers: []
                    },
                    x: 2
                }
            ]);
        });
    });

    describe("#getBoxPlotScatterData()", () => {
        it("returns correct box plot scatter data", () => {
            const sampleAlterations = {
                "VENHQS1PUi1BNUoxLTAxOmFjY190Y2dh": [],
                "VENHQS1PUi1BNUoyLTAxOmFjY190Y2dh": [],
                "VENHQS1PUi1BNUozLTAxOmFjY190Y2dh": []
            }
            assert.deepEqual(getBoxPlotScatterData(exampleMolecularData, "acc_tcga_rna_seq_v2_mrna", sampleAlterations, []), 
                exampleBoxPlotScatterData);
        });
    });

    describe("#getGroupColumns()", () => {
        it("returns correct group columns", () => {
            assert.deepEqual(getGroupColumns([]),[]);
            assert.deepEqual(_.map(getGroupColumns([{name:"altered group", description:""}]),datum=>datum.name),['altered group']);
            assert.deepEqual(_.map(getGroupColumns([{name:"altered group", description:""},{name:"unaltered group", description:""}], true),datum=>datum.name),["Log Ratio", "Tendency", "altered group", "unaltered group"]);
            assert.deepEqual(_.map(getGroupColumns([{name:"group1", description:""},{name:"group2", description:""}]),datum=>datum.name),["Log Ratio", "Enriched in", "group1", "group2"]);
            assert.deepEqual(_.map(getGroupColumns([{name:"group1", description:""},{name:"group2", description:""}, {name:"group3", description:""}]),datum=>datum.name),["group1", "group2", "group3"]);
        });
    });

    describe("#getEnrichmentBarPlotData()", () => {
        it("returns correct data", () => {
            //empty requests
            assert.deepEqual(getEnrichmentBarPlotData([], []), []);
            //empty genes
            assert.deepEqual(getEnrichmentBarPlotData(exampleAlterationEnrichmentRowData, []), []);
            //genes not present in data
            assert.deepEqual(getEnrichmentBarPlotData(exampleAlterationEnrichmentRowData, ['ABC']), []);
            //genes present in data
            assert.deepEqual(getEnrichmentBarPlotData(exampleAlterationEnrichmentRowData, ['EGFR']), [
                { "minorCategory": "altered group", "counts": [{ "majorCategory": "EGFR", "count": 3, "percentage": 100 }] },
                { "minorCategory": "unaltered group", "counts": [{ "majorCategory": "EGFR", "count": 0, "percentage": 0 }] }
            ]);
        });
    });

    describe("#getGeneListOptions()", () => {
        it("returns correct options", () => {
            //empty requests
            assert.deepEqual(getGeneListOptions([]), [{ "label": "User-defined List", "value": "" }]);

            //non empty requests
            assert.deepEqual(getGeneListOptions(exampleAlterationEnrichmentRowData), [
                { "label": "User-defined List", "value": "" },
                { "label": "Top 3 genes with max frequency in any group", "value": "EGFR FBXW4 CAND2" },
                { "label": "Top 3 genes with avg. frequency in any group", "value": "EGFR FBXW4 CAND2" },
                { "label": "Top 3 genes with significant p-value", "value": "EGFR FBXW4 CAND2" }
            ]);

        });
    });
});

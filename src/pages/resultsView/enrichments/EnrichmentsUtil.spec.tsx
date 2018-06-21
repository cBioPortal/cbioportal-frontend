import { assert } from 'chai';
import React from 'react';
import { calculateAlterationTendency, calculateExpressionTendency, formatLogOddsRatio, formatValueWithStyle, 
    formatPercentage, getAlterationScatterData, getExpressionScatterData, roundLogRatio, 
    getAlterationRowData, getExpressionRowData, getFilteredData, getBarChartTooltipContent, getBoxPlotScatterData, 
    getDownloadContent, getAlterationsTooltipContent, shortenGenesLabel, getBoxPlotModels
} from "./EnrichmentsUtil";
import expect from 'expect';
import expectJSX from 'expect-jsx';

expect.extend(expectJSX);

const exampleAlterationEnrichments = [
    {
        "entrezGeneId": 1956,
        "hugoGeneSymbol": "EGFR",
        "cytoband": "7p11.2",
        "alteredCount": 3,
        "unalteredCount": 0,
        "logRatio": "Infinity",
        "pValue": 0.00003645111904935468,
        "qValue": 0.2521323904643863
    },
    {
        "entrezGeneId": 6468,
        "hugoGeneSymbol": "FBXW4",
        "cytoband": "10q24.32",
        "alteredCount": 2,
        "unalteredCount": 0,
        "logRatio": "Infinity",
        "pValue": 0.0015673981191222392,
        "qValue": 0.9385345997286061
    }, 
    {
        "entrezGeneId": 23066,
        "hugoGeneSymbol": "CAND2",
        "cytoband": "3p25.2",
        "alteredCount": 2,
        "unalteredCount": 0,
        "logRatio": "Infinity",
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
        "alteredCount": 3,
        "alteredPercentage": 75,
        "unalteredCount": 0,
        "unalteredPercentage": 0,
        "logRatio": Infinity,
        "pValue": 0.00003645111904935468,
        "qValue": 0.2521323904643863
    },
    {
        "checked": false,
        "disabled": false,
        "entrezGeneId": 6468,
        "hugoGeneSymbol": "FBXW4",
        "cytoband": "10q24.32",
        "alteredCount": 2,
        "alteredPercentage": 50,
        "unalteredCount": 0,
        "unalteredPercentage": 0,
        "logRatio": Infinity,
        "pValue": 0.0015673981191222392,
        "qValue": 0.9385345997286061
    }, 
    {
        "checked": false,
        "disabled": false,
        "entrezGeneId": 23066,
        "hugoGeneSymbol": "CAND2",
        "cytoband": "3p25.2",
        "alteredCount": 2,
        "alteredPercentage": 50,
        "unalteredCount": 0,
        "unalteredPercentage": 0,
        "logRatio": Infinity,
        "pValue": 0.0015673981191222392,
        "qValue": 0.9385345997286061
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

    describe("#formatLogOddsRatio()", () => {
        it("returns <-10 for -11", () => {
            assert.equal(formatLogOddsRatio(-11), "<-10");
        });

        it("returns >10 for 11", () => {
            assert.equal(formatLogOddsRatio(11), ">10");
        });

        it("returns 10 for 10", () => {
            assert.equal(formatLogOddsRatio(10), "10.00");
        });

        it("returns 1.23 for 1.234", () => {
            assert.equal(formatLogOddsRatio(1.234), "1.23");
        });
    });

    describe("#formatValueWithStyle()", () => {
        it("returns <span>0.300</span> for 0.3", () => {
            expect(formatValueWithStyle(0.3)).toEqualJSX(<span>0.300</span>);
        });

        it("returns <b><span>0.030</span></b> for 0.03", () => {
            expect(formatValueWithStyle(0.03)).toEqualJSX(<b><span>0.0300</span></b>);
        });
    });

    describe("#formatPercentage()", () => {
        it("returns 5 (10.35%) for 5 and 10.3452", () => {
            assert.equal(formatPercentage(5, 10.3452), "5 (10.35%)");
        });

        it("returns 1 (1.00%) for 1 and 1", () => {
            assert.equal(formatPercentage(1, 1), "1 (1.00%)");
        });
    });

    describe("#getAlterationScatterData()", () => {
        it("returns empty array for empty array", () => {
            assert.deepEqual(getAlterationScatterData([], []), []);
        });

        it("returns correct scatter data", () => {
            assert.deepEqual(getAlterationScatterData(exampleAlterationEnrichmentRowData, ["EGFR"]), [
                {x: 10, y: 2.804820678721167, hugoGeneSymbol: "FBXW4", logRatio: Infinity, qValue: 0.9385345997286061, hovered: false},
                {x: 10, y: 2.804820678721167, hugoGeneSymbol: "CAND2", logRatio: Infinity, qValue: 0.9385345997286061, hovered: false},
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
                    logRatio: -0.7514352361955119, qValue: 0.000024032306741578182, hovered: false},
                {x: 1.373692179998275, y: 8.431950829601448, hugoGeneSymbol: "PTPN3", entrezGeneId: 5774, 
                    logRatio: 1.373692179998275, qValue: 0.000024032306741578182, hovered: false},
                {x: 2.652285592481328, y: 8.249349711250797, hugoGeneSymbol: "EPHB3", entrezGeneId: 2049,
                    logRatio: 2.652285592481328, qValue: 0.000024395252515979897, hovered: false}
            ]);
        });
    });

    describe("#roundLogRatio()", () => {
        it("returns 5 for 8 and 5", () => {
            assert.equal(roundLogRatio(8, 5), 5);
        });

        it("returns -3 for -4 and 3", () => {
            assert.equal(roundLogRatio(-4, 3), -3);
        });

        it("returns 3.21 for 3.2123 and 10", () => {
            assert.equal(roundLogRatio(3.2123, 10), 3.21);
        });
    });

    describe("#getAlterationRowData()", () => {
        it("returns empty array for empty array", () => {
            assert.deepEqual(getAlterationRowData([], 0, 0, []), []);
        });

        it("returns correct row data", () => {
            assert.deepEqual(getAlterationRowData(exampleAlterationEnrichments, 4, 84, ["EGFR"]), exampleAlterationEnrichmentRowData);
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
            assert.deepEqual(getFilteredData(exampleExpressionEnrichmentRowData, true, true, false, null), 
                exampleExpressionEnrichmentRowData);

            assert.deepEqual(getFilteredData(exampleExpressionEnrichmentRowData, true, false, true, null), [
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

            assert.deepEqual(getFilteredData(exampleExpressionEnrichmentRowData, false, true, false, ["DHRS7B", "PTPN3"]), [
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
});

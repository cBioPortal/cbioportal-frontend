import {assert} from 'chai';
import {
    calculateLogRank,
    convertScatterDataToDownloadData,
    downSampling,
    filteringScatterData,
    getDownloadContent,
    getEstimates,
    getLineData,
    getMedian,
    getScatterData,
    getScatterDataWithOpacity,
    getStats,
    ScatterData
} from "./SurvivalUtil";

const exampleAlteredPatientSurvivals = [
    {
        patientId: "TCGA-OR-A5J1",
        studyId: "acc_tcga",
        months: 5.09,
        status: false
    },
    {
        patientId: "TCGA-OR-A5J2",
        studyId: "acc_tcga",
        months: 0.09,
        status: true
    },
];

const exampleUnalteredPatientSurvivals = [

    {
        patientId: "TCGA-OR-A5J3",
        studyId: "acc_tcga",
        months: 0,
        status: false
    },
    {
        patientId: "TCGA-2F-A9KO",
        studyId: "blca_tcga",
        months: 63.83,
        status: true
    },
    {
        patientId: "TCGA-2F-A9KP",
        studyId: "blca_tcga",
        months: 0.13,
        status: false
    },
    {
        patientId: "TCGA-2F-A9KQ",
        studyId: "blca_tcga",
        months: 182.19,
        status: true
    }
];


const allScatterData: ScatterData[] = [
    {
        x: 0,
        y: 10,
        patientId: '',
        studyId: '',
        status: true
    },
    {
        x: 0.5,
        y: 9,
        patientId: '',
        studyId: '',
        status: true
    },
    {
        x: 1,
        y: 8,
        patientId: '',
        studyId: '',
        status: true
    },
    {
        x: 0,
        y: 10,
        patientId: '',
        studyId: '',
        status: true
    },
    {
        x: 0,
        y: 10,
        patientId: '',
        studyId: '',
        status: true
    }
];

const examplePatientSurvivals = exampleAlteredPatientSurvivals.concat(exampleUnalteredPatientSurvivals);

const exampleAlteredEstimates = [1, 0.8];
const exampleUnalteredEstimates = [0.8, 0.5333333333333333, 0.5333333333333333, 0];
const exampleEstimates = exampleAlteredEstimates.concat(exampleUnalteredEstimates);

describe("SurvivalUtil", () => {
    describe("#getEstimates()", () => {
        it("returns empty list for empty list", () => {
            assert.deepEqual(getEstimates([]), []);
        });

        it("returns correct estimates for the example data", () => {
            assert.deepEqual(getEstimates(examplePatientSurvivals), exampleEstimates);
        });
    });

    describe("#getMedian()", () => {
        it("returns NA for empty list", () => {
            assert.equal(getMedian([], []), "NA");
        });

        it("returns 182.19 for the example data", () => {
            assert.equal(getMedian(examplePatientSurvivals, exampleEstimates), "182.19");
        });
    });

    describe("#getLineData()", () => {
        it("returns [{x: 0, y: 100}] for empty list", () => {
            assert.deepEqual(getLineData([], []), [{ x: 0, y: 100 }]);
        });

        it("returns correct line data for the example data", () => {
            assert.deepEqual(getLineData(examplePatientSurvivals, exampleEstimates), [
                { x: 0, y: 100 },
                { x: 5.09, y: 100 },
                { x: 0.09, y: 80 },
                { x: 0, y: 80 },
                { x: 63.83, y: 53.3333333333333333 },
                { x: 0.13, y: 53.3333333333333333 },
                { x: 182.19, y: 0 }
            ]);
        });
    });

    describe("#getScatterData()", () => {
        it("returns empty list for empty list", () => {
            assert.deepEqual(getScatterData([], []), []);
        });

        it("returns correct scatter data for the example data", () => {
            assert.deepEqual(getScatterData(examplePatientSurvivals, exampleEstimates), [
                { x: 5.09, y: 100, patientId: "TCGA-OR-A5J1", studyId: "acc_tcga", status: false },
                { x: 0.09, y: 80, patientId: "TCGA-OR-A5J2", studyId: "acc_tcga", status: true },
                { x: 0, y: 80, patientId: "TCGA-OR-A5J3", studyId: "acc_tcga", status: false },
                { x: 63.83, y: 53.3333333333333333, patientId: "TCGA-2F-A9KO", studyId: "blca_tcga", status: true },
                { x: 0.13, y: 53.3333333333333333, patientId: "TCGA-2F-A9KP", studyId: "blca_tcga", status: false },
                { x: 182.19, y: 0, patientId: "TCGA-2F-A9KQ", studyId: "blca_tcga", status: true }
            ]);
        });
    });

    describe("#getScatterDataWithOpacity()", () => {
        it("returns empty list for empty list", () => {
            assert.deepEqual(getScatterDataWithOpacity([], []), []);
        });

        it("returns correct scatter data with opacity for the example data", () => {
            assert.deepEqual(getScatterDataWithOpacity(examplePatientSurvivals, exampleEstimates), [
                { x: 5.09, y: 100, patientId: "TCGA-OR-A5J1", studyId: "acc_tcga", status: false, opacity: 1 },
                { x: 0.09, y: 80, patientId: "TCGA-OR-A5J2", studyId: "acc_tcga", status: true, opacity: 0 },
                { x: 0, y: 80, patientId: "TCGA-OR-A5J3", studyId: "acc_tcga", status: false, opacity: 1 },
                { x: 63.83, y: 53.3333333333333333, patientId: "TCGA-2F-A9KO", studyId: "blca_tcga", status: true, opacity: 0 },
                { x: 0.13, y: 53.3333333333333333, patientId: "TCGA-2F-A9KP", studyId: "blca_tcga", status: false, opacity: 1 },
                { x: 182.19, y: 0, patientId: "TCGA-2F-A9KQ", studyId: "blca_tcga", status: true, opacity: 0 }
            ]);
        });
    });

    describe("#getStats()", () => {
        it("returns [0, 0, \"NA\"] for empty list", () => {
            assert.deepEqual(getStats([], []), [0, 0, "NA"]);
        });

        it("returns correct stats for the example data", () => {
            assert.deepEqual(getStats(examplePatientSurvivals, exampleEstimates), [6, 3, "182.19"]);
        });
    });

    describe("#calculateLogRank()", () => {
        it("returns NaN for empty list", () => {
            assert.isNaN(calculateLogRank([], []));
        });

        it("returns correct log rank for the example data", () => {
            assert.equal(calculateLogRank(exampleAlteredPatientSurvivals, exampleUnalteredPatientSurvivals), 0.08326451662523682);
            assert.equal(calculateLogRank([
                    {months: 0, status: true, patientId: "", studyId: ""}
                ], [
                    {months: 0, status: false, patientId: "", studyId: ""}
                ]), 0.31731050786294357);
            assert.isNaN(calculateLogRank([
                    {months: 1, status: false, patientId: "", studyId: ""}
                ], [
                    {months: 2, status: false, patientId: "", studyId: ""}
                ]), "returns NaN if every status is false");
            assert.equal(calculateLogRank([
                    {months: 1, status: true, patientId: "", studyId: ""},
                    {months: 2, status: false, patientId: "", studyId: ""}
                ], [
                    {months: 2, status: false, patientId: "", studyId: ""}
                ]), 0.4795001221869757);
            assert.equal(calculateLogRank([
                    {months: 1, status: false, patientId: "", studyId: ""},
                    {months: 2, status: false, patientId: "", studyId: ""},
                    {months: 3, status: false, patientId: "", studyId: ""}
                ], [
                    {months: 3, status: true, patientId: "", studyId: ""},
                    {months: 2, status: true, patientId: "", studyId: ""},
                    {months: 1, status: true, patientId: "", studyId: ""}
                ]), 0.5637028616507919);
        });
    });

    describe("#getDownloadContent()", () => {
        it("returns correct download content for the example data", () => {
            assert.equal(getDownloadContent(getScatterData(exampleAlteredPatientSurvivals, exampleAlteredEstimates),
                getScatterData(exampleUnalteredPatientSurvivals, exampleUnalteredEstimates),
                "test_main_title", "test_altered_title", "test_unaltered_title"), "test_main_title\n\ntest_altered_title\nCase ID\tStudy ID\t" +
                "Number at Risk\tStatus\tSurvival Rate\tTime (months)\nTCGA-OR-A5J1\tacc_tcga\t2\tcensored\t1\t5.09\nTCGA-OR-A5J2\tacc_tcga\t1\t" +
                "deceased\t0.8\t0.09\n\ntest_unaltered_title\nCase ID\tStudy ID\tNumber at Risk\tStatus\tSurvival Rate\tTime (months)\nTCGA-OR-A5J3\t" +
                "acc_tcga\t4\tcensored\t0.8\t0\nTCGA-2F-A9KO\tblca_tcga\t3\tdeceased\t0.5333333333333333\t63.83\nTCGA-2F-A9KP\tblca_tcga\t2\tcensored\t" +
                "0.5333333333333333\t0.13\nTCGA-2F-A9KQ\tblca_tcga\t1\tdeceased\t0\t182.19");
        });
    });

    describe("#convertScatterDataToDownloadData()", () => {
        it("returns empty list for empty list", () => {
            assert.deepEqual(convertScatterDataToDownloadData(getScatterData([], [])), []);
        });

        it("returns correct download data for the example data", () => {
            assert.deepEqual(convertScatterDataToDownloadData(getScatterData(examplePatientSurvivals, exampleEstimates)), [
                { "Time (months)": 5.09, "Survival Rate": 1, "Case ID": "TCGA-OR-A5J1", "Study ID": "acc_tcga", "Status": "censored", "Number at Risk": 6 },
                { "Time (months)": 0.09, "Survival Rate": 0.8, "Case ID": "TCGA-OR-A5J2", "Study ID": "acc_tcga", "Status": "deceased", "Number at Risk": 5 },
                { "Time (months)": 0, "Survival Rate": 0.8, "Case ID": "TCGA-OR-A5J3", "Study ID": "acc_tcga", "Status": "censored", "Number at Risk": 4 },
                { "Time (months)": 63.83, "Survival Rate": 0.5333333333333333, "Case ID": "TCGA-2F-A9KO", "Study ID": "blca_tcga", "Status": "deceased", "Number at Risk": 3 },
                { "Time (months)": 0.13, "Survival Rate": 0.5333333333333333, "Case ID": "TCGA-2F-A9KP", "Study ID": "blca_tcga", "Status": "censored", "Number at Risk": 2 },
                { "Time (months)": 182.19, "Survival Rate": 0, "Case ID": "TCGA-2F-A9KQ", "Study ID": "blca_tcga", "Status": "deceased", "Number at Risk": 1 }
            ]);
        });
    });

    describe("#downSampling()", () => {
        it("return empty list for empty list", () => {
            assert.deepEqual(downSampling([], {
                xDenominator: 100,
                yDenominator: 100,
                threshold: 100
            }), []);
        });

        it("when any denominator is 0, return the full data", () => {
            let opts = {
                xDenominator: 0,
                yDenominator: 100,
                threshold: 100
            };
            assert.deepEqual(downSampling(allScatterData, opts), allScatterData);
        });

        it("when any denominator is negative value, return the full data", () => {
            let opts = {
                xDenominator: -1,
                yDenominator: 100,
                threshold: 100
            };
            assert.deepEqual(downSampling(allScatterData, opts), allScatterData);
        });

        it("Remove the dot which too close from the last dot", () => {
            // In this case, the hypotenuse is always 1, keep the threshold at 2.5
            assert.deepEqual(downSampling([{
                x: 0,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            },{
                x: 2,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            },{
                x: 10,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            }], {
                xDenominator: 4,
                yDenominator: 4,
                threshold: 100
            }), [{
                x: 0,
                y: 10,
                patientId: '',
                studyId: '',
                opacity: 1,
                status: true
            },{
                x: 10,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            }]);
        });

        it("Remove the dot which too close from the last dot, ignore the status", () => {
            // In this case, the hypotenuse is always 1, keep the threshold at 2.5
            assert.deepEqual(downSampling([{
                x: 0,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            },{
                x: 2,
                y: 10,
                opacity: 0,
                patientId: '',
                studyId: '',
                status: false
            },{
                x: 10,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            }], {
                threshold: 100,
                xDenominator: 4,
                yDenominator: 4
            }), [{
                x: 0,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            },{
                x: 10,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            }]);
        });

        it("Remove the dot when the distance from last dot equals to the threshold", () => {
            // In this case, the hypotenuse is always 1, keep the threshold at 2
            assert.deepEqual(downSampling([{
                x: 0,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            },{
                x: 2,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            },{
                x: 10,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            }], {
                threshold: 100,
                xDenominator: 5,
                yDenominator: 5
            }), [{
                x: 0,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            },{
                x: 10,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            }]);
        });

        it("when a hidden dot between two visualized dots, the distance between two vis dots should be calculated separately from the hidden dot", () => {
            // In this case, the hypotenuse is always 1, keep the threshold at 1.25
            assert.deepEqual(downSampling([{
                x: 0,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            },{
                x: 1,
                y: 10,
                opacity: 0,
                patientId: '',
                studyId: '',
                status: false
            },{
                x: 2,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            },{
                x: 10,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            }], {
                threshold: 100,
                xDenominator: 8,
                yDenominator: 8
            }), [{
                x: 0,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            },{
                x: 2,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            },{
                x: 10,
                y: 10,
                opacity: 1,
                patientId: '',
                studyId: '',
                status: true
            }]);
        });
    });

    describe("filteringScatterData()", () => {
        it("Return full data if the filers are undefined", () => {
            let testData = {
                altered: {
                    numOfCases: allScatterData.length,
                    line: [],
                    scatter: allScatterData,
                    scatterWithOpacity: allScatterData
                }
            };
            assert.deepEqual(filteringScatterData(testData, undefined, {
                xDenominator: 100,
                yDenominator: 100,
                threshold: 100
            }), testData);
        });

        it("return correct data after filtering and down sampling", () => {
            let testScatterData = [{
                x: 0,
                y: 10,
                patientId: '',
                studyId: '',
                status: true
            }, {
                x: 0.5,
                y: 9,
                patientId: '',
                studyId: '',
                status: true
            }, {
                x: 1,
                y: 8,
                patientId: '',
                studyId: '',
                status: true
            }];
            let testData = {
                altered: {
                    numOfCases: testScatterData.length,
                    line: [],
                    scatter: testScatterData,
                    scatterWithOpacity: testScatterData
                }
            };
            var result = filteringScatterData(testData, {x: [0, 10], y: [9, 10]}, {
                xDenominator: 2,
                yDenominator: 2,
                threshold: 2
            });
            assert.deepEqual(result.altered.numOfCases, 2);
            assert.deepEqual(result.altered.scatter[1], {
                x: 0.5,
                y: 9,
                patientId: '',
                studyId: '',
                status: true
            });
        });
    });
});

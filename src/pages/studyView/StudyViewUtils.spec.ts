import { assert } from 'chai';
import { ClinicalDataCount } from 'shared/api/generated/CBioPortalAPIInternal';
import { getPieSliceColors, annotatePieChartDatum } from 'pages/studyView/StudyViewUtils';
import sinon from 'sinon';
import internalClient from "shared/api/cbioportalInternalClientInstance";
import { ClinicalDataType } from 'pages/studyView/StudyViewPageStore';

const clinicalDataCount: ClinicalDataCount[] = [
    { count: 10, value: "Slice1" },
    { count: 5, value: "NA" },
    { count: 20, value: "Slice2" },
    { count: 30, value: "Slice3" },

];
describe('StudyViewUtils', () => {

    describe('getPieSliceColors', () => {
        it("returns color set for each value(slice)", () => {
            assert.deepEqual(getPieSliceColors(clinicalDataCount), { 'Slice1': "#2986e2", 'Slice2': "#dc3912", 'Slice3': "#f88508", 'NA': "#CCCCCC" })
        });
    });

    describe('annotatePieChartDatum', () => {
        const initalColorSet = getPieSliceColors(clinicalDataCount)
        it("returns correct annotated data for initally loaded chart", () => {
            assert.deepEqual(annotatePieChartDatum(clinicalDataCount, [], initalColorSet), [
                { count: 10, value: "Slice1", fill: "#2986e2" },
                { count: 5, value: "NA", fill: "#CCCCCC" },
                { count: 20, value: "Slice2", fill: "#dc3912" },
                { count: 30, value: "Slice3", fill: "#f88508" },
            ])
        });

        it("returns correct annotated data when filter is applied to that chart", () => {
            assert.deepEqual(annotatePieChartDatum(clinicalDataCount, ["Slice1"], initalColorSet), [
                { count: 10, value: "Slice1", fill: "#2986e2", stroke: "#cccccc", strokeWidth: 3 },
                { count: 5, value: "NA", fill: "#808080", fillOpacity: '0.5' },
                { count: 20, value: "Slice2", fill: "#808080", fillOpacity: '0.5' },
                { count: 30, value: "Slice3", fill: "#808080", fillOpacity: '0.5' },
            ])
        });

        it("returns correct annotated data when filter is applied to other chart", () => {
            const updatedCounts = [
                { count: 5,  value: "Slice1" },
                { count: 10, value: "Slice2" },
                { count: 20, value: "Slice3" },
            
            ]
            assert.deepEqual(annotatePieChartDatum(updatedCounts, [], initalColorSet), [
                { count: 5, value: "Slice1", fill: "#2986e2" },
                { count: 10, value: "Slice2", fill: "#dc3912" },
                { count: 20, value: "Slice3", fill: "#f88508" },
            ])
        });
    });
});

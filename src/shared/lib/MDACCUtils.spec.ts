import {assert} from "chai";
import {getHeatmapMeta} from "./MDACCUtils";

describe("MDACCUtils", () => {
    describe("getHeatmapMeta", () => {
        // These tests will be transferred to e2e tests once the interface is finalized
        // it("return empty array for other non heatmap services", (done) => {
        //     getHeatmapMeta("")
        //         .then(result => {
        //             assert.deepEqual(result, []);
        //             done();
        //         })
        //         .catch(done);
        // }).timeout(5000);
        //
        // it("return empty array when the heatmap service can not find anything for the query", (done) => {
        //     getHeatmapMeta("//bioinformatics.mdanderson.org/dyce?app=chmdb2&command=studyurl&studyid=acc_tcga")
        //         .then(result => {
        //             assert.deepEqual(result, []);
        //             done();
        //         })
        //         .catch(done);
        // }).timeout(5000);
        //
        // it("return proper result", (done) => {
        //     getHeatmapMeta("//bioinformatics.mdanderson.org/dyce?app=chmdb2&command=studyurl&studyid=blca_tcga_pub")
        //         .then(result => {
        //             assert.deepEqual(result, ["view=0&p0DiseaseInput=blca"]);
        //             done();
        //         })
        //         .catch(done);
        // }).timeout(5000);
    });
});
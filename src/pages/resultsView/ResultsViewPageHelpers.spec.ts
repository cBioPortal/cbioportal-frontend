import {assert} from "chai";
import {getTabId} from "./ResultsViewPageHelpers";

describe("ResultsViewPageHelpers", () => {
    describe("getTabId", ()=>{
        it("gets the tab id correctly", ()=>{
            assert.equal(getTabId("results"), undefined);
            assert.equal(getTabId("results/"), undefined);
            assert.equal(getTabId("results/asdf"), "asdf");
            assert.equal(getTabId("results/oncoprint"), "oncoprint");
            assert.equal(getTabId("results/oncoprint/"), "oncoprint");
        });
    });
});
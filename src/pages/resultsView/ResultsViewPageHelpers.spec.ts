import {assert} from "chai";
import {getTabId, ResultsViewTab} from "./ResultsViewPageHelpers";

describe("ResultsViewPageHelpers", () => {
    describe("getTabId", ()=>{
        it("gets the tab id correctly", ()=>{
            assert.equal(getTabId("results"), undefined);
            assert.equal(getTabId("results/"), undefined);
            assert.equal(getTabId("results/asdf"), "asdf" as any);
            assert.equal(getTabId("results/oncoprint"), ResultsViewTab.ONCOPRINT);
            assert.equal(getTabId("results/oncoprint/"), ResultsViewTab.ONCOPRINT);
        });
    });
});
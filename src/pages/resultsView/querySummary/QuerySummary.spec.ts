import {assert} from "chai";
import {geneSummary} from "./QuerySummary";

describe("QuerySummary", () => {
    describe("geneSummary", ()=>{
        it("gives correct summary for various numbers of genes", ()=>{
            assert.equal(geneSummary([]), "");
            assert.equal(geneSummary(["BRCA1"]), "BRCA1");
            assert.equal(geneSummary(["BRCA1","BRCA2"]), "BRCA1 & BRCA2");
            assert.equal(geneSummary(["A","B","C"]), "A, B & C");
            assert.equal(geneSummary(["A","B","C","D"]), "A, B & 2 other genes");
            assert.equal(geneSummary(["A","B","C","D","E"]), "A, B & 3 other genes");
            assert.equal(geneSummary(["A","B","C","D","E","F","G","H"]), "A, B & 6 other genes");
        });
    });
});
import {assert} from "chai";
import {getAlterationSummary, getGeneSummary} from "./QuerySummaryUtils";
import * as React from "react";
import expect from 'expect';
import expectJSX from 'expect-jsx';
expect.extend(expectJSX);

describe("QuerySummaryUtils", () => {
    describe("getGeneSummary", ()=>{
        it("gives correct summary for various numbers of genes", ()=>{
            assert.equal(getGeneSummary([]), "");
            assert.equal(getGeneSummary(["BRCA1"]), "BRCA1");
            assert.equal(getGeneSummary(["BRCA1","BRCA2"]), "BRCA1 & BRCA2");
            assert.equal(getGeneSummary(["A","B","C"]), "A, B & C");
            assert.equal(getGeneSummary(["A","B","C","D"]), "A, B & 2 other genes");
            assert.equal(getGeneSummary(["A","B","C","D","E"]), "A, B & 3 other genes");
            assert.equal(getGeneSummary(["A","B","C","D","E","F","G","H"]), "A, B & 6 other genes");
        });
    });
    describe("getAlterationSummary", ()=>{
        it("gives correct summary for various inputs", ()=>{
            expect(getAlterationSummary(10, 10, 10, 10, 5)).toEqualJSX(<strong>
                Queried genes are altered in 10 (100%) of queried samples
            </strong>, "all altered, same number samples and patients");
            expect(getAlterationSummary(10, 8, 7, 4, 1)).toEqualJSX(<strong>
                Queried gene is altered in 4 (50%) of queried patients and 7 (70%) of queried samples
            </strong>, "not all altered, different number samples and patients");
            expect(getAlterationSummary(8, 8, 0, 0, 1)).toEqualJSX(<strong>
                Queried gene is altered in 0 (0%) of queried samples
            </strong>, "none altered, same number samples and patients");
        });
    });
});
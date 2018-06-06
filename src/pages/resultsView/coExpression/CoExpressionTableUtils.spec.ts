import {assert} from "chai";
import {cytobandFilter} from "./CoExpressionTableUtils";
import {CoExpression} from "../../../shared/api/generated/CBioPortalAPIInternal";

describe("CoExpressionTableUtils", ()=>{
    describe("cytobandFilter", ()=>{
        it("returns false if no cytoband", ()=>{
            assert.isFalse(cytobandFilter({ cytoband: null } as any as CoExpression, "asdfa"));
        });
        it("returns false if no match", ()=>{
            assert.isFalse(cytobandFilter({ cytoband: "hello" } as any as CoExpression, "hi"))
        });
        it("returns false if match in middle", ()=>{
            assert.isFalse(cytobandFilter({ cytoband: "hello" } as any as CoExpression, "ell"));
        });
        it("returns true if match at beginning", ()=>{
            assert.isTrue(cytobandFilter({ cytoband: "hello" } as any as CoExpression, "h"));
            assert.isTrue(cytobandFilter({ cytoband: "hello" } as any as CoExpression, "he"));
            assert.isTrue(cytobandFilter({ cytoband: "hello" } as any as CoExpression, "hel"));
            assert.isTrue(cytobandFilter({ cytoband: "hello" } as any as CoExpression, "hell"));
            assert.isTrue(cytobandFilter({ cytoband: "hello" } as any as CoExpression, "hello"));
        });
        it("returns false if no match for complete query", ()=>{
            assert.isFalse(cytobandFilter({ cytoband: "hello" } as any as CoExpression, "hellothere"));
        });
        it("returns true on empty input", ()=>{
            assert.isTrue(cytobandFilter({ cytoband: "hello" } as any as CoExpression, ""));
        });
        it("returns true if minus sign at beginning and nothing following", ()=>{
            assert.isTrue(cytobandFilter({ cytoband: "hello" } as any as CoExpression, "-"));
        });
        it("returns false if match but minus sign at beginning of filter string", ()=>{
            assert.isFalse(cytobandFilter({ cytoband: "hello" } as any as CoExpression, "-he"));
            assert.isFalse(cytobandFilter({ cytoband: "17p" } as any as CoExpression, "-17p"));
        });
        it("returns true if no match but minus sign at beginning", ()=>{
            assert.isTrue(cytobandFilter({ cytoband: "17p" } as any as CoExpression, "-3p"));
        });
        it("returns true if match in middle but minus sign at beginning", ()=>{
            assert.isTrue(cytobandFilter({ cytoband: "17p" } as any as CoExpression, "-7p"));
        });
        it("returns true if matches at least one query, all positive", ()=>{
            assert.isTrue(cytobandFilter({ cytoband: "17p" } as any as CoExpression, "17p 5p 3p"));
        });
        it("returns true if no match every query, all negative", ()=>{
            assert.isTrue(cytobandFilter({ cytoband: "17p" } as any as CoExpression, "-5 -3 -7p -1p"));
        });
        it("returns true if passes at least one positive query and every negative query", ()=>{
            assert.isTrue(cytobandFilter({ cytoband: "17p" } as any as CoExpression, "-5 -3 17p -7p -1p 3p"));
        });
        it("returns false if it doesnt match any query, all positive", ()=>{
            assert.isFalse(cytobandFilter({ cytoband: "17p" } as any as CoExpression, "1p 1q 5p"));
        });
        it("returns false if it matches at least one query, all negative", ()=>{
            assert.isFalse(cytobandFilter({ cytoband: "17p" } as any as CoExpression, "-5 -3 -17p -1p"));
        });
        it("returns false if fails every query, mix of positive and negative", ()=>{
            assert.isFalse(cytobandFilter({ cytoband: "17p" } as any as CoExpression, "-17p 3q -1"));
        });
    });
});
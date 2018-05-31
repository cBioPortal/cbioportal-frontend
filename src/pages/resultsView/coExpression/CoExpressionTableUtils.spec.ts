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
    });
});
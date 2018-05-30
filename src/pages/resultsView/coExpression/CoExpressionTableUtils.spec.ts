import {assert} from "chai";
import {cytobandFilter} from "./CoExpressionTableUtils";
import {CoExpression} from "../../../shared/api/generated/CBioPortalAPIInternal";

describe("CoExpressionTableUtils", ()=>{
    describe("cytobandFilter", ()=>{
        it("returns false if no cytoband", ()=>{
            assert.isFalse(cytobandFilter({ cytoband: null } as any as CoExpression, "asdfa"));
        });
        it("returns false if no match", ()=>{
            assert.isFalse(cytobandFilter({ cytoband: "hello" } as any as CoExpression, "hi"));
        });
        it("returns true if match", ()=>{
            assert.isTrue(cytobandFilter({ cytoband: "hello" } as any as CoExpression, "ell"));
        });
        it("returns false if match but minus sign at beginning of filter string", ()=>{
            assert.isFalse(cytobandFilter({ cytoband: "hello" } as any as CoExpression, "-ell"));
        });
    });
});
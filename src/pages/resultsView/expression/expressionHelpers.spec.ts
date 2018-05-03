import {assert} from "chai";
import {isPanCanStudy, isTCGAProvStudy, isTCGAPubStudy} from "./expressionHelpers";

describe('getDefaultSelectedStudiesForExpressionTab',()=>{

    // "blca_tcga_pub"
    // "blca_tcga_pub_2017"
    // "blca_tcga_pan_can_atlas_2018"
    // "chol_tcga_pan_can_atlas_2018"
    // "laml_tcga_pan_can_atlas_2018"
    // "laml_tcga"
    // "blca_tcga"
    // "chol_tcga"
    // "coadread_tcga"
    //

    it('recognizes pub tcga study',()=>{
        const studyId = "blca_tcga_pub";
        assert.true(isTCGAPubStudy(studyId));
        assert.isFalse(isTCGAProvStudy(studyId));
        assert.isFalse(isPanCanStudy(studyId));
    });

    it('recognizes provisional tcga study',()=>{
        const studyId = "blca_tcga";
        assert.isFalse(isTCGAPubStudy(studyId));
        assert.isTrue(isTCGAProvStudy(studyId));
        assert.isFalse(isPanCanStudy(studyId));
    });

    it('recognizes pan can tcga study',()=>{
        const studyId = "blca_tcga_pan_can_atlas_2018";
        assert.isFalse(isTCGAPubStudy(studyId));
        assert.isFalse(isTCGAProvStudy(studyId));
        assert.isTrue(isPanCanStudy(studyId));
    });

});
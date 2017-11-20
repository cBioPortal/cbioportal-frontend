import { assert } from 'chai';
import getOverlappingStudies from "./getOverlappingStudies";
import {CancerStudy} from "../api/generated/CBioPortalAPI";

describe('getOverlappingStudies',()=>{

    it('finds overlapping studies based on pub/nonpub signature in studyId', ()=>{

        let studies = [
            { studyId:'moo_tcga'},
            { studyId: 'moo1_tcga_pub'}
        ];

        let ret = getOverlappingStudies(studies as CancerStudy[]);

        assert.equal(ret.length, 0);

        // now adjust
        studies = [
            { studyId:'moo_tcga'},
            { studyId: 'moo_tcga_pub'}
        ];

        ret = getOverlappingStudies(studies as CancerStudy[]);

        assert.equal(ret[0][0].studyId,'moo_tcga');
        assert.equal(ret[0][1].studyId,'moo_tcga_pub');

    });

})
import {assert} from 'chai';
import { correctPatientUrl } from "./urlCorrection";

describe('correctPatientUrl', () => {

    it('corrects hash route scheme to standard route (html5) but leaves navCaseIds as hash param', () => {

        let before = 'http://www.cbioportal.org/case.do#/patient?studyId=chol_nus_2012&caseId=B085&navCaseIds=B085,B099,R104,T026,U044,W012,W039,W040';
        let after = 'http://www.cbioportal.org/patient?studyId=chol_nus_2012&caseId=B085#&navCaseIds=B085,B099,R104,T026,U044,W012,W039,W040';

        assert.equal(correctPatientUrl(before), after);

        before = 'http://www.cbioportal.org/case.do#/patient?studyId=chol_nus_2012&navCaseIds=B085,B099,R104,T026,U044,W012,W039,W040&caseId=B085';
        after = 'http://www.cbioportal.org/patient?studyId=chol_nus_2012&caseId=B085#&navCaseIds=B085,B099,R104,T026,U044,W012,W039,W040';

        assert.equal(correctPatientUrl(before), after, 'handles params after navCaseIds');

    });

    it('leaves a correct url untouched', () => {
        const correct = 'http://www.cbioportal.org/patient?studyId=chol_nus_2012&caseId=B085#navCaseIds=B085,B099,R104,T026,U044,W012,W039,W040';
        assert.equal(correctPatientUrl(correct), correct);
    });


});
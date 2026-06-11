import { assert } from 'chai';
import { sampleFusionViewerHref } from './cohortLinks';

describe('sampleFusionViewerHref', () => {
    it('builds a patient-view href deep-linked to the fusion viewer tab', () => {
        const href = sampleFusionViewerHref('demo_cohort', 'SAMPLE_001');
        assert.include(href, 'studyId=demo_cohort');
        assert.include(href, 'caseId=SAMPLE_001');
        assert.include(href, 'tab=fusionViewer');
    });

    it('url-encodes ids', () => {
        const href = sampleFusionViewerHref('a b', 'c/d');
        assert.include(href, 'studyId=a%20b');
        assert.include(href, 'caseId=c%2Fd');
    });
});

import { assert } from 'chai';
import { sampleFusionViewerHref } from './cohortLinks';

describe('sampleFusionViewerHref', () => {
    it('deep-links to the fusion viewer tab via the path segment and sampleId', () => {
        const href = sampleFusionViewerHref('demo_cohort', 'SAMPLE_001');
        // Tab is selected by the path segment, not a tab= query.
        assert.include(href, 'patient/fusionViewer');
        // Sample loaded via sampleId (sample mode), study via studyId.
        assert.include(href, 'sampleId=SAMPLE_001');
        assert.include(href, 'studyId=demo_cohort');
        // The old broken shape must be gone.
        assert.notInclude(href, 'caseId=');
        assert.notInclude(href, 'tab=fusionViewer');
    });

    it('url-encodes ids', () => {
        const href = sampleFusionViewerHref('a b', 'c/d');
        assert.include(href, 'studyId=a%20b');
        assert.include(href, 'sampleId=c%2Fd');
    });
});

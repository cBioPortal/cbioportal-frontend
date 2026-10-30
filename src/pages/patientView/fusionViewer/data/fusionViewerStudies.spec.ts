import { assert } from 'chai';
import { isFusionViewerEnabled } from './fusionViewerStudies';

describe('isFusionViewerEnabled', () => {
    it('is off when no study list is configured', () => {
        assert.isFalse(isFusionViewerEnabled(['study_a'], undefined));
        assert.isFalse(isFusionViewerEnabled(['study_a'], null));
        assert.isFalse(isFusionViewerEnabled(['study_a'], ''));
        assert.isFalse(isFusionViewerEnabled(['study_a'], ' , ,'));
    });

    it('is on for a study in the comma-separated list', () => {
        assert.isTrue(isFusionViewerEnabled(['study_a'], 'study_a'));
        assert.isTrue(
            isFusionViewerEnabled(['study_b'], ' study_a , study_b ')
        );
    });

    it('is off for a study that is not listed', () => {
        assert.isFalse(isFusionViewerEnabled(['study_c'], 'study_a,study_b'));
    });

    it('matches whole study ids, not prefixes', () => {
        assert.isFalse(isFusionViewerEnabled(['study_ab'], 'study_a'));
    });

    it('needs every study of the patient to be listed', () => {
        assert.isFalse(
            isFusionViewerEnabled(['study_a', 'study_c'], 'study_a')
        );
    });

    it('is off when the patient has no known study yet', () => {
        assert.isFalse(isFusionViewerEnabled([], 'study_a'));
        assert.isFalse(isFusionViewerEnabled([], undefined, true));
    });

    it('the fusionViewer feature flag turns it on for any study', () => {
        assert.isTrue(isFusionViewerEnabled(['study_c'], undefined, true));
        assert.isTrue(isFusionViewerEnabled(['study_c'], 'study_a', true));
    });

    it('is off for an unlisted study when the flag is off', () => {
        assert.isFalse(isFusionViewerEnabled(['study_c'], 'study_a', false));
    });
});

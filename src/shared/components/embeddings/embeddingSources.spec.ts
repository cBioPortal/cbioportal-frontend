import { assert } from 'chai';
import { autorun } from 'mobx';
import {
    getLoadedEmbeddingOptions,
    hasEmbeddingForStudies,
    isAnyEmbeddingPending,
    MSKTARGET_STUDY_ID,
} from './embeddingSources';

/**
 * The loaders are module-level singletons that fetch once, on first
 * observation, so these run in order: each asserts on what has been requested
 * by the time it runs.
 */
describe('embeddingSources', () => {
    let requested: string[] = [];
    let originalFetch: any;
    let disposers: (() => void)[] = [];

    beforeEach(() => {
        requested = [];
        originalFetch = (global as any).fetch;
        // Never settles, so an observed loader stays pending and is not retried.
        (global as any).fetch = (url: string) => {
            requested.push(url);
            return new Promise(() => {});
        };
    });

    afterEach(() => {
        disposers.forEach(dispose => dispose());
        disposers = [];
        (global as any).fetch = originalFetch;
    });

    // Reading a loader's status only starts its fetch from a reactive context,
    // which is where these are read in the app.
    function observe(read: () => void) {
        disposers.push(autorun(read));
    }

    it('fetches nothing for a study no map covers', () => {
        const scope = { studyIds: ['not_a_real_study'], hasFeatureFlag: true };
        observe(() => {
            getLoadedEmbeddingOptions(scope);
            isAnyEmbeddingPending(scope);
        });
        assert.deepEqual(requested, []);
    });

    it('answers whether a study is covered without fetching', () => {
        assert.isTrue(
            hasEmbeddingForStudies({
                studyIds: [MSKTARGET_STUDY_ID],
                hasFeatureFlag: false,
            }),
            'MSK-TARGET has a map and does not need the feature flag'
        );
        assert.isFalse(
            hasEmbeddingForStudies({
                studyIds: ['msk_impact_50k_2026'],
                hasFeatureFlag: false,
            }),
            'the Mosaic map asks for the feature flag'
        );
        assert.deepEqual(requested, []);
    });

    it('fetches the MSK-TARGET map for its own study', () => {
        const scope = {
            studyIds: [MSKTARGET_STUDY_ID],
            hasFeatureFlag: false,
        };
        observe(() => {
            getLoadedEmbeddingOptions(scope);
            isAnyEmbeddingPending(scope);
        });
        assert.deepEqual(requested, [
            'https://github.mskcc.org/pages/debruiji/embedding-for-target/msktarget_rna_tsne_mpath.json',
        ]);
    });
});

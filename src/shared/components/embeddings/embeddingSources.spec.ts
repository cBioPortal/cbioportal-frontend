import { assert } from 'chai';
import { autorun } from 'mobx';
import { getLoadConfig } from 'config/config';
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

    beforeAll(() => {
        getLoadConfig().apiRoot = 'https://cbioportal.mskcc.org/';
    });

    afterAll(() => {
        delete getLoadConfig().apiRoot;
    });

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
                hasFeatureFlag: true,
            }),
            'MSK-TARGET has a map'
        );
        assert.isFalse(
            hasEmbeddingForStudies({
                studyIds: [MSKTARGET_STUDY_ID],
                hasFeatureFlag: false,
            }),
            'and asks for the feature flag, as every map does for now'
        );
        assert.isFalse(
            hasEmbeddingForStudies({
                studyIds: ['msk_impact_50k_2026'],
                hasFeatureFlag: false,
            }),
            'as does the Mosaic map'
        );
        assert.deepEqual(requested, []);
    });

    it('fetches nothing for a covered study without the feature flag', () => {
        const scope = {
            studyIds: [MSKTARGET_STUDY_ID],
            hasFeatureFlag: false,
        };
        observe(() => {
            getLoadedEmbeddingOptions(scope);
            isAnyEmbeddingPending(scope);
        });
        assert.deepEqual(requested, []);
    });

    it('fetches the MSK-TARGET map for its own study', () => {
        const scope = {
            studyIds: [MSKTARGET_STUDY_ID],
            hasFeatureFlag: true,
        };
        observe(() => {
            getLoadedEmbeddingOptions(scope);
            isAnyEmbeddingPending(scope);
        });
        // From the portal itself, which serves the map behind its login.
        assert.deepEqual(requested, [
            'https://cbioportal.mskcc.org/embeddings/msktarget_rna_tsne_mpath.json',
        ]);
    });
});

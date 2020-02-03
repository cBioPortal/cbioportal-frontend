import {
    CancerStudyQueryUrlParams,
    QueryStore,
} from 'shared/components/query/QueryStore';
import { ResultsViewTab } from 'pages/resultsView/ResultsViewPageHelpers';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';

export function createQueryStore(
    currentQuery?: any,
    urlWrapper?: ResultsViewURLWrapper,
    clearUrl = true
) {
    const win: any = window;

    const queryStore = new QueryStore(currentQuery);

    queryStore.singlePageAppSubmitRoutine = function(
        query: CancerStudyQueryUrlParams
    ) {
        // normalize this
        query.cancer_study_list =
            query.cancer_study_list || query.cancer_study_id;
        delete query.cancer_study_id;

        const tab =
            queryStore.physicalStudyIdsInSelection.length > 1 &&
            queryStore.geneIds.length === 1
                ? ResultsViewTab.CANCER_TYPES_SUMMARY
                : ResultsViewTab.ONCOPRINT;

        const wrapper =
            urlWrapper || new ResultsViewURLWrapper(win.routingStore);

        wrapper.updateURL(
            Object.assign({}, query, { comparison_sessionId: undefined }),
            `results/${tab}`,
            clearUrl,
            false
        );

        // we only want to destroy the urlwrapper if we just created it for submission purpose
        // i.e. it was NOT passed to us
        if (urlWrapper === undefined) {
            wrapper.destroy();
        }
    };

    return queryStore;
}

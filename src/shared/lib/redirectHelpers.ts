import ExtendedRouterStore from './ExtendedRouterStore';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { QueryParams } from 'url';
import { PatientViewUrlParams } from '../../pages/patientView/PatientViewPage';
import AppConfig from 'appConfig';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';

export function restoreRouteAfterRedirect(injected: {
    routing: ExtendedRouterStore;
}) {
    const win = getBrowserWindow();

    const key = injected.routing.location.query.key;
    let restoreRoute = win.localStorage.getItem(key);
    if (restoreRoute) {
        restoreRoute = restoreRoute.replace(/^#/, '');
        win.localStorage.removeItem(key);
        if (restoreRoute.includes(win.location.hostname)) {
            win.location.href = restoreRoute;
        } else {
            injected.routing.push(restoreRoute);
        }
    } else {
        injected.routing.push('/');
    }
    return null;
}

// harvest query data written to the page by JSP to support queries originating
// from external posts
export function handlePostedSubmission(urlWrapper: ResultsViewURLWrapper) {
    if (getBrowserWindow().postData) {
        urlWrapper.updateURL(
            getBrowserWindow().postData,
            'results',
            true,
            true
        );
        // we don't want this data to be around anymore once we've tranferred it to URL
        getBrowserWindow().postData = null;
    }
}

export function handleLegacySubmission(urlWrapper: ResultsViewURLWrapper) {
    const legacySubmission = localStorage.getItem('legacyStudySubmission');
    localStorage.removeItem('legacyStudySubmission');
    if (legacySubmission) {
        const parsedSubmission: any = JSON.parse(legacySubmission);
        if (parsedSubmission.Action) {
            urlWrapper.updateURL(parsedSubmission, 'results');
        }
    }
}

export function handleCaseDO() {
    const routingStore: ExtendedRouterStore = getBrowserWindow().routingStore;

    const newParams: Partial<PatientViewUrlParams> = {};

    const currentQuery = routingStore.location.query;

    if (currentQuery.cancer_study_id) {
        newParams.studyId = currentQuery.cancer_study_id;
    }

    if (currentQuery.case_id) {
        newParams.caseId = currentQuery.case_id;
    }

    if (currentQuery.sample_id) {
        newParams.sampleId = currentQuery.sample_id;
    }

    if (
        routingStore.location.hash &&
        routingStore.location.hash.includes('nav_case_ids')
    ) {
        routingStore.location.hash = routingStore.location.hash!.replace(
            /nav_case_ids/,
            'navCaseIds'
        );
    }

    (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(
        newParams,
        '/patient',
        true
    );
}

/*
 * Handle LinkOut of style /ln?q=TP53:MUT and ln?cancer_study_id=gbm_tcga&q=EGFR+NF1.
 */
export function handleLinkOut() {
    const routingStore: ExtendedRouterStore = getBrowserWindow().routingStore;
    const currentQuery = routingStore.location.query;

    const data = {
        case_set_id: 'all',
        gene_list: currentQuery.q.replace('+', ','),
        cancer_study_list:
            currentQuery.cancer_study_id ||
            // use same set of studies as quick search gene query if no
            // specific study is supplied
            AppConfig.serverConfig.default_cross_cancer_study_session_id ||
            AppConfig.serverConfig.default_cross_cancer_study_list,
    };

    (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(
        data,
        '/results/mutations',
        true,
        true
    );
}

export function handleStudyDO() {
    (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(
        {},
        '/study',
        false
    );
}

export function handleIndexDO() {
    if (/Action=Submit/i.test(window.location.search)) {
        let data: QueryParams = {};

        // ALL QUERIES NOW HAVE cancer_study_list. if we have a legacy cancer_study_id but not a cancer_study_list, copy it over
        if (
            !getBrowserWindow().routingStore.location.query.cancer_study_list &&
            getBrowserWindow().routingStore.location.query.cancer_study_id
        ) {
            data.cancer_study_list = getBrowserWindow().routingStore.location.query.cancer_study_id;
            data.cancer_study_id = undefined;
        }

        (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(
            data,
            '/results'
        );
    } else if (/session_id/.test(window.location.search)) {
        (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(
            {},
            '/results'
        );
    } else {
        (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(
            {},
            '/'
        );
    }
}

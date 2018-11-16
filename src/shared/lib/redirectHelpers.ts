import ExtendedRouterStore from "./ExtendedRouterStore";
import getBrowserWindow from "./getBrowserWindow";
import {QueryParams} from "url";
import {PatientViewUrlParams} from "../../pages/patientView/PatientViewPage";
import {Patient} from "../api/generated/CBioPortalAPI";
import {StudyViewURLQuery} from "../../pages/studyView/StudyViewPageStore";

export function restoreRouteAfterRedirect(injected: { routing:ExtendedRouterStore }){

    const key = injected.routing.location.query.key;
    let restoreRoute = window.localStorage.getItem(key);
    if (restoreRoute) {
        restoreRoute = restoreRoute.replace(/^#/, '');
        window.localStorage.removeItem(key);
        injected.routing.push(restoreRoute);
    } else {
        injected.routing.push('/');
    }
    return null;

}


export function handleLegacySubmission(){
    const legacySubmission = localStorage.getItem("legacyStudySubmission");
    localStorage.removeItem("legacyStudySubmission");
    if (legacySubmission) {
        const parsedSubmission:any = JSON.parse(legacySubmission);
        if (parsedSubmission.Action) {
            (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(parsedSubmission, "results");
        }
    }
}

export function handleCaseDO(){

    const routingStore:ExtendedRouterStore = getBrowserWindow().routingStore;

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

    if (routingStore.location.hash && routingStore.location.hash.includes("nav_case_ids")) {
        routingStore.location.hash = routingStore.location.hash!.replace(/nav_case_ids/,"navCaseIds");
    }

    (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(newParams, "/patient", true);

}

export function handleStudyDO(){
    (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute({}, "/study", false);
}


export function handleIndexDO(){
    if (/Action=Submit/i.test(window.location.search)) {

        let data: QueryParams = {};

        // ALL QUERIES NOW HAVE cancer_study_list. if we have a legacy cancer_study_id but not a cancer_study_list, copy it over
        if (!getBrowserWindow().routingStore.location.query.cancer_study_list && getBrowserWindow().routingStore.location.query.cancer_study_id) {
            data.cancer_study_list = getBrowserWindow().routingStore.location.query.cancer_study_id;
            data.cancer_study_id = undefined;
        }

        (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(data, "/results");
    } else if (/session_id/.test(window.location.search)) {
        (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute({}, "/results");
    } else {
        (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute({}, "/");
    }
}
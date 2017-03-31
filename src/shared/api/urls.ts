import AppConfig from "appConfig";

export function getHost(){
    return (window as any).__API_ROOT__;
}

export function getCbioPortalApiUrl() {
    return `//${getHost()}/api`;
}
export function getStudyViewUrl(studyId:string) {
    return `//${getCbioPortalApiUrl()}/study?id=${studyId}`;
}
export function getStudySummaryUrl(studyId:string) {
    return `//${getCbioPortalApiUrl()}/study?id=${studyId}#summary`;
}

export function getPubMedUrl(pmid:string) {
    return `http://www.ncbi.nlm.nih.gov/pubmed/${pmid}`;
}
export function getOncoQueryDocUrl() {
    return `//${getHost()}/onco_query_lang_desc.jsp`;
}
export function getHotspotsApiUrl() {
    return `//${getHost()}/proxy/cancerhotspots.org`;
}
export function getHotspots3DApiUrl() {
    return `//${getHost()}/proxy/3dhotspots.org/3d`;
}
export function getOncoKbApiUrl() {
    return `//${getHost()}/proxy/oncokb.org/api/v1`;
}
export function getTissueImageCheckUrl(filter:string) {
    return `//${getHost()}/proxy/cancer.digitalslidearchive.net/local_php/get_slide_list_from_db_groupid_not_needed.php?slide_name_filter=${filter}`;
}

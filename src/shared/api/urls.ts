import AppConfig from "appConfig";

export function getCbioPortalApiUrl() {
    return `//${AppConfig.host}/api`;
}
export function getStudyViewUrl(studyId:string) {
    return `//${AppConfig.host}/study?id=${studyId}`;
}
export function getStudySummaryUrl(studyId:string) {
    return `//${AppConfig.host}/study?id=${studyId}#summary`;
}

export function getPubMedUrl(pmid:string) {
    return `http://www.ncbi.nlm.nih.gov/pubmed/${pmid}`;
}
export function getOncoQueryDocUrl() {
    return `//${AppConfig.host}/onco_query_lang_desc.jsp`;
}
export function getHotspotsApiUrl() {
    return `//${AppConfig.host}/proxy/cancerhotspots.org`;
}
export function getHotspots3DApiUrl() {
    return `//${AppConfig.host}/proxy/3dhotspots.org/3d`;
}
export function getOncoKbApiUrl() {
    return `//${AppConfig.host}/proxy/oncokb.org/api/v1`;
}
export function getTissueImageCheckUrl(filter:string) {
    return `//${AppConfig.host}/proxy/cancer.digitalslidearchive.net/local_php/get_slide_list_from_db_groupid_not_needed.php?slide_name_filter=${filter}`;
}

import {default as URL, QueryParams} from "url";

export function getHost(){
    return (window as any).__API_ROOT__;
}

export type BuildUrlParams = {pathname:string, query?:QueryParams, hash?:string};

export function buildCBioPortalUrl(params:BuildUrlParams):string;
export function buildCBioPortalUrl(pathname:string, query?:QueryParams, hash?:string):string;
export function buildCBioPortalUrl(pathnameOrParams:string | BuildUrlParams, query?:QueryParams, hash?:string) {
    let params:BuildUrlParams = typeof pathnameOrParams === 'string' ? {pathname: pathnameOrParams, query, hash} : pathnameOrParams;
    return URL.format({
        protocol: window.location.protocol,
        host: getHost(),
        ...params
    });
}

const cbioUrl = buildCBioPortalUrl;

export function getCbioPortalApiUrl() {
    return cbioUrl('api');
}
export function getStudyViewUrl(studyId:string) {
    return cbioUrl('study', {id: studyId});
}
export function getStudySummaryUrl(studyId:string) {
    return cbioUrl('study', {id: studyId}, 'summary');
}

type SubmitQueryUrlParams = {
    cancer_study_list: ReadonlyArray<string>,
    cancer_study_id: string,
    genetic_profile_ids_PROFILE_MUTATION_EXTENDED: '',
    data_priority: '0'|'1'|'2',
    case_set_id: string,
    case_ids: string,
    patient_case_select: 'sample' | 'patient',
    gene_set_choice: 'user-defined-list',
    gene_list: string,
    clinical_param_selection: '',
    tab_index: 'tab_download' | 'tab_visualize',
    Action: 'Submit',
};
export function getSubmitQueryUrl(params:SubmitQueryUrlParams) {
    return cbioUrl('index.do', params);
}
export function getPubMedUrl(pmid:string) {
    return `http://www.ncbi.nlm.nih.gov/pubmed/${pmid}`;
}
export function getOncoQueryDocUrl() {
    return cbioUrl('onco_query_lang_desc.jsp');
}
export function getHotspotsApiUrl() {
    return cbioUrl('proxy/cancerhotspots.org');
}
export function getHotspots3DApiUrl() {
    return cbioUrl('proxy/3dhotspots.org/3d');
}
export function getOncoKbApiUrl() {
    return cbioUrl('proxy/oncokb.org/api/v1');
}
export function getTissueImageCheckUrl(filter:string) {
    return cbioUrl('proxy/cancer.digitalslidearchive.net/local_php/get_slide_list_from_db_groupid_not_needed.php', {
        slide_name_filter: filter
    });
}
export function getDarwinUrl(sampleIds:string[], caseId:string) {
    return cbioUrl('checkDarwinAccess.do', {sample_id: sampleIds.join(','), case_id: caseId});
}

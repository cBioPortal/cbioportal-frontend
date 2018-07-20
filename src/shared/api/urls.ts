import {default as URL, QueryParams} from "url";
import AppConfig from "appConfig";
import formSubmit from "shared/lib/formSubmit";

export function getHost(){
    if (typeof AppConfig.apiRoot === 'string') {
        return AppConfig.apiRoot.replace(/^http[s]?:\/\//,'').replace(/\/$/,""); // get rid of protocol and trailing slashes
    } else {
        return AppConfig.apiRoot;
    }
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
function getStudySummaryUrlParams(studyIds:string | ReadonlyArray<string>) {
    let cohortsArray:ReadonlyArray<string>;
    if (typeof studyIds === "string") {
        cohortsArray = [studyIds];
    } else {
        cohortsArray = studyIds;
    }
    return {pathname:'study', query: {id: cohortsArray.join(",")}};
}

export function getStudySummaryUrl(studyIds:string | ReadonlyArray<string>) {
    const params = getStudySummaryUrlParams(studyIds);
    return cbioUrl(params.pathname, params.query);
}
export function openStudySummaryFormSubmit(studyIds: string | ReadonlyArray<string>) {
    const params = getStudySummaryUrlParams(studyIds);
    const method:"get"|"post" = params.query.id.length > 1800 ? "post" : "get";
    formSubmit(params.pathname, params.query, "_blank", method);
}
export function getSampleViewUrl(studyId:string, sampleId:string) {
    return cbioUrl('patient', { sampleId, studyId });
}
export function getPatientViewUrl(studyId:string, caseId:string) {
    return cbioUrl('patient', { studyId, caseId });
}
export function getPubMedUrl(pmid:string) {
    return `https://www.ncbi.nlm.nih.gov/pubmed/${pmid}`;
}
export function getMyGeneUrl(entrezGeneId: number) {
    return `https://mygene.info/v3/gene/${entrezGeneId}?fields=uniprot`;
}
export function getUniprotIdUrl(swissProtAccession: string) {
    return `https://www.uniprot.org/uniprot/?query=accession:${swissProtAccession}&format=tab&columns=entry+name`;
}
export function getMutationAlignerUrl() {
    return cbioUrl(`getMutationAligner.json`);
}
export function getOncoQueryDocUrl() {
    return cbioUrl('onco_query_lang_desc.jsp');
}
export function getOncoKbApiUrl() {
    let url = AppConfig.oncoKBApiUrl;

    if (typeof url === 'string') {
        // we need to support legacy configuration values
        url = url.replace(/^http[s]?:\/\//,''); // get rid of protocol
        url = url.replace(/\/$/,""); // get rid of trailing slashes
        return cbioUrl(`proxy/${url}`)
    } else {
        return undefined;
    }

}
export function getGenomeNexusApiUrl() {
    let url = AppConfig.genomeNexusApiUrl;
    if (typeof url === 'string') {
        // use url if https, otherwise use proxy
        if (url.startsWith('https://')) {
            return url
        } else {
            // we need to support legacy configuration values
            url = url.replace(/^http[s]?:\/\//,''); // get rid of protocol
            url = url.replace(/\/$/,""); // get rid of trailing slashes
            return cbioUrl(`proxy/${url}`)
        }
    } else {
        return undefined;
    }
}

export function getSessionServiceApiUrl() {
    return cbioUrl(`/api-legacy/proxy/session/virtual_study`);
}

export function getG2SApiUrl() {
    return 'https://g2s.genomenexus.org';
}
export function getTissueImageCheckUrl(filter:string) {
    return cbioUrl('proxy/cancer.digitalslidearchive.net/local_php/get_slide_list_from_db_groupid_not_needed.php', {
        slide_name_filter: filter
    });
}
export function getDarwinUrl(sampleIds:string[], caseId:string) {
    return cbioUrl('checkDarwinAccess.do', {sample_id: sampleIds.join(','), case_id: caseId});
}

export function getStudyDownloadListUrl(){
    return cbioUrl('proxy/download.cbioportal.org/study_list.json');
}

export function getSessionServiceUrl(){
    return cbioUrl('api-legacy/proxy/session/main_session');
}


export function getBitlyServiceUrl(){
    return cbioUrl('api-legacy/proxy/bitly');
}
export function getBasePath(){
    return AppConfig.baseUrl!.replace(/[^\/]*/,"");
}
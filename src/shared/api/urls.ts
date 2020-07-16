import { default as URL, QueryParams } from 'url';
import AppConfig from 'appConfig';
import { BuildUrlParams, getBrowserWindow } from 'cbioportal-frontend-commons';
import { DEFAULT_MUTATION_ALIGNER_URL_TEMPLATE } from 'react-mutation-mapper';
import * as _ from 'lodash';
import { GroupComparisonLoadingParams } from '../../pages/groupComparison/GroupComparisonLoading';
import { GroupComparisonURLQuery } from '../../pages/groupComparison/GroupComparisonURLWrapper';
import { PagePath } from 'shared/enums/PagePaths';
import { EncodedURLParam } from '../lib/bitly';

export function trimTrailingSlash(str: string) {
    return str.replace(/\/$/g, '');
}

export function buildCBioPortalAPIUrl(params: BuildUrlParams): string;
export function buildCBioPortalAPIUrl(
    pathname: string,
    query?: QueryParams,
    hash?: string
): string;
export function buildCBioPortalAPIUrl(
    pathnameOrParams: string | BuildUrlParams,
    query?: QueryParams,
    hash?: string
) {
    let params: BuildUrlParams =
        typeof pathnameOrParams === 'string'
            ? { pathname: pathnameOrParams, query, hash }
            : pathnameOrParams;

    const apiRootUrl = URL.parse(trimTrailingSlash(AppConfig.apiRoot!));

    // prepend the root path (e.g. "beta"
    params.pathname =
        trimTrailingSlash(apiRootUrl.pathname || '') +
        '/' +
        (params.pathname || '');

    return URL.format({
        protocol: apiRootUrl.protocol || getBrowserWindow().location.protocol,
        host: apiRootUrl.host!,
        ...params,
    });
}

// this will produce a URL relative to the host protocol of the current HTML page in browser
export function buildCBioPortalPageUrl(params: BuildUrlParams): string;
export function buildCBioPortalPageUrl(
    pathname: string,
    query?: QueryParams,
    hash?: string
): string;
export function buildCBioPortalPageUrl(
    pathnameOrParams: string | BuildUrlParams,
    query?: QueryParams,
    hash?: string
) {
    let params: BuildUrlParams =
        typeof pathnameOrParams === 'string'
            ? { pathname: pathnameOrParams, query, hash }
            : pathnameOrParams;
    return URL.format({
        protocol: window.location.protocol,
        host: AppConfig.baseUrl,
        ...params,
    });
}

export function getCurrentURLWithoutHash() {
    return URL.format({
        protocol: window.location.protocol,
        host: window.location.host,
        pathname: window.location.pathname,
        search: window.location.search,
    });
}

// this gives us the root of the instance (.e.g. //www.bioportal.org/beta)
export function buildCBioLink(path: string) {
    return '//' + AppConfig.baseUrl + '/' + path;
}

export function getCbioPortalApiUrl() {
    const root = trimTrailingSlash(AppConfig.apiRoot!);
    return `${root}/api`;
}

export function getFrontendAssetUrl(path: string) {
    const root = trimTrailingSlash(AppConfig.frontendUrl!);
    return `${root}/${path}`;
}

function getStudySummaryUrlParams(studyIds: string | ReadonlyArray<string>) {
    let cohortsArray: ReadonlyArray<string>;
    if (typeof studyIds === 'string') {
        cohortsArray = [studyIds];
    } else {
        cohortsArray = studyIds;
    }
    return { pathname: 'study', query: { id: cohortsArray.join(',') } };
}

export function getStudySummaryUrl(studyIds: string | ReadonlyArray<string>) {
    const params = getStudySummaryUrlParams(studyIds);
    return buildCBioPortalPageUrl(params.pathname, params.query);
}
export function redirectToStudyView(studyIds: string | ReadonlyArray<string>) {
    const params = getStudySummaryUrlParams(studyIds);
    (window as any).routingStore.updateRoute(
        params.query,
        PagePath.Study,
        true
    );
}
export function getSampleViewUrl(
    studyId: string,
    sampleId: string,
    navIds?: { patientId: string; studyId: string }[]
) {
    let hash: any = undefined;
    if (navIds) {
        hash = `navCaseIds=${navIds
            .map(id => `${id.studyId}:${id.patientId}`)
            .join(',')}`;
    }
    return buildCBioPortalPageUrl('patient', { sampleId, studyId }, hash);
}
export function getPatientViewUrl(
    studyId: string,
    caseId: string,
    navIds?: { patientId: string; studyId: string }[]
) {
    let hash: any = undefined;
    if (navIds) {
        hash = `navCaseIds=${navIds
            .map(id => `${id.studyId}:${id.patientId}`)
            .join(',')}`;
    }
    return buildCBioPortalPageUrl('patient', { studyId, caseId }, hash);
}

export function getComparisonUrl(params: Partial<GroupComparisonURLQuery>) {
    return buildCBioPortalPageUrl('comparison', params);
}

export function redirectToComparisonPage(
    win: Window,
    params: Partial<GroupComparisonURLQuery>
) {
    (win as any).location.href = getComparisonUrl(params);

    //(win as any).routingStore.updateRoute(params, "comparison", true);
}

export function getComparisonLoadingUrl(
    params?: Partial<GroupComparisonLoadingParams>
) {
    return buildCBioPortalPageUrl('loading/comparison', params || {});
}

export function getPubMedUrl(pmid: string) {
    return _.template(AppConfig.serverConfig.pubmed_url!)({ pmid });
}

export function getMyGeneUrl(entrezGeneId: number) {
    return _.template(AppConfig.serverConfig.mygene_info_url!)({
        entrezGeneId,
    });
}

export function getUniprotIdUrl(swissProtAccession: string) {
    return _.template(AppConfig.serverConfig.uniprot_id_url!)({
        swissProtAccession: swissProtAccession,
    });
}

export function getMutationAlignerUrlTemplate() {
    return getProxyUrlIfNecessary(DEFAULT_MUTATION_ALIGNER_URL_TEMPLATE);
}

export function getOncoQueryDocUrl() {
    return buildCBioPortalPageUrl('/oql');
}

export function trimProtocol(url: string) {
    // we need to support legacy configuration values
    url = url.replace(/^http[s]?:\/\//, ''); // get rid of protocol
    url = url.replace(/\/$/, ''); // get rid of trailing slashes
    url = url.replace(/^\/+/, ''); // get rid of leading slashes
    return url;
}
export function getProxyUrlIfNecessary(url: any) {
    if (typeof url === 'string') {
        // use url if https, otherwise use proxy
        if (url.startsWith('https://')) {
            return url;
        } else {
            url = trimProtocol(url);
            return buildCBioPortalAPIUrl(`proxy/${url}`);
        }
    } else {
        return undefined;
    }
}

export function getOncoKbApiUrl() {
    return buildCBioPortalAPIUrl(`proxy/oncokb`);
}

export function getInstituteLogoUrl() {
    if (AppConfig.serverConfig.skin_right_logo) {
        if (/^http/.test(AppConfig.serverConfig.skin_right_logo)) {
            return AppConfig.serverConfig.skin_right_logo;
        } else {
            return buildCBioPortalPageUrl(
                `images/${AppConfig.serverConfig.skin_right_logo}`
            );
        }
    } else {
        return undefined;
    }
}

export function getGenomeNexusApiUrl() {
    let url = AppConfig.serverConfig.genomenexus_url;
    return getProxyUrlIfNecessary(url);
}

export function getGenomeNexusHgvsgUrl(
    hgvsg: string,
    referenceGenomeUrl: string | undefined
) {
    return referenceGenomeUrl === AppConfig.serverConfig.genomenexus_url_grch38
        ? `${AppConfig.serverConfig.genomenexus_url_grch38}/variant/${hgvsg}`
        : `${AppConfig.serverConfig.genomenexus_website_url}/variant/${hgvsg}`;
}

export function getSessionUrl() {
    if (
        AppConfig.serverConfig &&
        AppConfig.serverConfig.hasOwnProperty('apiRoot')
    ) {
        // TODO: remove this after switch to AWS. This is a hack to use proxy
        // session-service from non apiRoot. We'll have to come up with a better
        // solution for auth portals
        return buildCBioPortalPageUrl('api/session');
    } else {
        return buildCBioPortalAPIUrl('api/session');
    }
}

export function fetchComparisonGroupsServiceUrl() {
    if (
        AppConfig.serverConfig &&
        AppConfig.serverConfig.hasOwnProperty('apiRoot')
    ) {
        // TODO: remove this after switch to AWS. This is a hack to use proxy
        // session-service from non apiRoot. We'll have to come up with a better
        // solution for auth portals
        return buildCBioPortalPageUrl('api/session/groups/fetch');
    } else {
        return buildCBioPortalAPIUrl('api/session/groups/fetch');
    }
}

export function getComparisonGroupServiceUrl() {
    if (
        AppConfig.serverConfig &&
        AppConfig.serverConfig.hasOwnProperty('apiRoot')
    ) {
        // TODO: remove this after switch to AWS. This is a hack to use proxy
        // session-service from non apiRoot. We'll have to come up with a better
        // solution for auth portals
        return buildCBioPortalPageUrl('api/session/group');
    } else {
        return buildCBioPortalAPIUrl('api/session/group');
    }
}

export function getComparisonSessionServiceUrl() {
    if (
        AppConfig.serverConfig &&
        AppConfig.serverConfig.hasOwnProperty('apiRoot')
    ) {
        // TODO: remove this after switch to AWS. This is a hack to use proxy
        // session-service from non apiRoot. We'll have to come up with a better
        // solution for auth portals
        return buildCBioPortalPageUrl('api/session/comparison_session');
    } else {
        return buildCBioPortalAPIUrl('api/session/comparison_session');
    }
}

export function getEncodedRedirectUrl(targetUrl: string) {
    return buildCBioPortalPageUrl('/encodedRedirect', {
        [EncodedURLParam]: btoa(targetUrl),
    });
}

export function getConfigurationServiceApiUrl() {
    return (
        AppConfig.configurationServiceUrl ||
        buildCBioPortalAPIUrl('config_service.jsp')
    );
}

export function getG2SApiUrl() {
    return AppConfig.serverConfig.g2s_url;
}

export function getDigitalSlideArchiveMetaUrl(patientId: string) {
    return AppConfig.serverConfig.digital_slide_archive_meta_url + patientId;
}
export function getDigitalSlideArchiveIFrameUrl(patientId: string) {
    return AppConfig.serverConfig.digital_slide_archive_iframe_url + patientId;
}

export function getDarwinUrl(sampleIds: string[], caseId: string) {
    return buildCBioPortalAPIUrl('checkDarwinAccess.do', {
        sample_id: sampleIds.join(','),
        case_id: caseId,
    });
}

export function getStudyDownloadListUrl() {
    return buildCBioPortalAPIUrl(
        'proxy/download.cbioportal.org/study_list.json'
    );
}

export function getMDAndersonHeatmapPatientUrl(patientId: string) {
    return AppConfig.serverConfig.mdacc_heatmap_patient_url + patientId;
}

export function getMDAndersonHeatMapMetaUrl(patientId: string) {
    return AppConfig.serverConfig.mdacc_heatmap_meta_url + patientId;
}

export function getMDAndersonHeatmapStudyMetaUrl(studyId: string) {
    return AppConfig.serverConfig.mdacc_heatmap_study_meta_url + studyId;
}

export function getMDAndersonHeatmapStudyUrl(studyId: string) {
    return AppConfig.serverConfig.mdacc_heatmap_study_url + studyId;
}

export function getBasePath() {
    return AppConfig.baseUrl!.replace(/[^\/]*/, '');
}

export function getDocsUrl(sourceUrl: string, docsBaseUrl?: string): string {
    // if it's complete url, then return it, otherwise, prefix with base url
    if (/^http/.test(sourceUrl)) {
        return sourceUrl;
    } else {
        return docsBaseUrl + '/' + sourceUrl;
    }
}

export function getWholeSlideViewerUrl(
    ids: string[],
    userName: string
): string {
    try {
        const tokenInfo = JSON.parse(
            AppConfig.serverConfig.mskWholeSlideViewerToken
        );
        const token = `&token=${tokenInfo.token}`;
        const time = `&t=${tokenInfo.time}`;
        const filterTree = ids.length === 1 ? '&filetree=off' : '';
        return ids.length >= 1
            ? `https://slides.mskcc.org/cbioportal?ids=${_.map(
                  ids,
                  id => id + '.svs'
              ).join(
                  ';'
              )}&user=${userName}${time}${token}&annotation=off${filterTree}`
            : '';
    } catch (ex) {
        throw 'error parsing mskWholeSlideViewerToken';
    }
}

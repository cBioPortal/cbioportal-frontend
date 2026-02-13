import React from 'react';
import ReactDOM from 'react-dom';
import { configure, toJS } from 'mobx';
import { Provider } from 'mobx-react';
import { Router } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { syncHistoryWithStore } from 'mobx-react-router';
import ExtendedRoutingStore from './shared/lib/ExtendedRouterStore';
import { datadogLogs } from '@datadog/browser-logs';

import {
    fetchServerConfig,
    getLoadConfig,
    getServerConfig,
    initializeAPIClients,
    initializeAppStore,
    initializeLoadConfiguration,
    initializeServerConfiguration,
} from './config/config';

import './shared/lib/ajaxQuiet';
import _ from 'lodash';
import $ from 'jquery';
import * as superagent from 'superagent';
import { buildCBioPortalPageUrl } from './shared/api/urls';
import browser from 'bowser';
import { setNetworkListener } from './shared/lib/ajaxQuiet';
import { initializeTracking, sendToLoggly } from 'shared/lib/tracking';
import superagentCache from 'superagent-cache';
import {
    getBrowserWindow,
    hashString,
    isWebdriver,
    onMobxPromise,
} from 'cbioportal-frontend-commons';
import { AppStore } from './AppStore';
import { handleLongUrls } from 'shared/lib/handleLongUrls';
import 'shared/polyfill/canvasToBlob';
import { setCurrentURLHeader } from 'shared/lib/extraHeader';
import Container from 'appShell/App/Container';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { IServerConfig } from 'config/IAppConfig';
import { initializeGenericAssayServerConfig } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import { FeatureFlagStore } from 'shared/FeatureFlagStore';
import eventBus from 'shared/events/eventBus';
import { SiteError } from 'shared/model/appMisc';
import load from 'little-loader';
import internalClient from 'shared/api/cbioportalInternalClientInstance';

export interface ICBioWindow {
    globalStores: {
        routing: ExtendedRoutingStore;
        appStore: AppStore;
    };
    routingStore: ExtendedRoutingStore;
    $: JQueryStatic;
    jQuery: JQueryStatic;

    e2etest: boolean;
    FRONTEND_VERSION: string;
    FRONTEND_COMMIT: string;
    rawServerConfig: IServerConfig;
    postLoadForMskCIS: () => void;
    isMSKCIS: boolean;
}

const browserWindow: ICBioWindow = window as any;

superagentCache(superagent);

configure({
    enforceActions: 'never',
    //disableErrorBoundaries: true
});
/*enableLogging({
    action: true,
    reaction: true,
    transaction: true,
    compute: true
});*/

// this must occur before we initialize tracking
// it fixes the hash portion of url when cohort patient list is too long
handleLongUrls();

// YOU MUST RUN THESE initialize and then set the public path after
initializeLoadConfiguration();
// THIS TELLS WEBPACK BUNDLE LOADER WHERE TO LOAD SPLIT BUNDLES
//@ts-ignore
__webpack_public_path__ = getLoadConfig().frontendUrl;

if (!browserWindow.hasOwnProperty('$')) {
    browserWindow.$ = $;
}

if (!browserWindow.hasOwnProperty('jQuery')) {
    browserWindow.jQuery = $;
}

// write browser name, version to body tag
if (browser) {
    $(document).ready(() => {
        $('body').addClass(browser.name);
    });
}

// e2e test specific stuff
if (getBrowserWindow().navigator.webdriver) {
    $(document).ready(() => {
        $('body').addClass('e2etest');
        browserWindow.e2etest = true;
    });
}

// if we are running e2e OR we are testing performance improvements manually
if (getBrowserWindow().navigator.webdriver || localStorage.recordAjaxQuiet) {
    setNetworkListener();
}

if (localStorage.getItem('timeElementVisible')) {
    const interval = setInterval(() => {
        const elementIsVisible = $(
            localStorage.getItem('timeElementVisible')!
        ).is(':visible');
        if (elementIsVisible) {
            clearInterval(interval);
            console.log(
                `TimeElementVisible for selector "${localStorage.timeElementVisible}"`,
                performance.now()
            );
        }
    }, 1000);
}

// for cbioportal instances, add an extra custom HTTP header to
// aid debugging in Sentry
if (/cbioportal\.org/.test(getBrowserWindow().location.href)) {
    setCurrentURLHeader();
}

// expose version on window
//@ts-ignore
browserWindow.FRONTEND_VERSION = VERSION;
//@ts-ignore
browserWindow.FRONTEND_COMMIT = COMMIT;

// this is a NOOP to fix CIS issue
browserWindow.postLoadForMskCIS = () => {};

// this is the only supported way to disable tracking for the $3Dmol.js
(browserWindow as any).$3Dmol = { notrack: true };

// expose lodash on window
getBrowserWindow()._ = _;

const routingStore = new ExtendedRoutingStore();

const history = createBrowserHistory({
    basename: getLoadConfig().basePath || '',
});

const syncedHistory = syncHistoryWithStore(history, routingStore);

const featureFlagStore = new FeatureFlagStore();

const stores = {
    // Key can be whatever you want
    routing: routingStore,
    appStore: new AppStore(featureFlagStore),
};

browserWindow.globalStores = stores;

eventBus.on('error', (err: SiteError) => {
    sendToLoggly({
        message: err?.errorObj?.message,
        ...err.meta,
    });
    stores.appStore.addError(err);
});

//@ts-ignore
const end = superagent.Request.prototype.end;

let redirecting = false;

//@ts-ignore
superagent.Request.prototype.end = function(callback) {
    return end.call(this, (error: any, response: any) => {
        if (redirecting) {
            return;
        }
        if (response && response.statusCode === 401) {
            var storageKey = `login-redirect`;

            localStorage.setItem(storageKey, window.location.href);

            // build URL with a reference to storage key so that /restore route can restore it after login
            //@ts-ignore because we're using buildCBioPortalPageUrl without a pathname, which is normally required
            const loginUrl = buildCBioPortalPageUrl({
                query: {
                    'spring-security-redirect': buildCBioPortalPageUrl({
                        pathname: 'restore',
                        query: { key: storageKey },
                    }),
                },
            });

            redirecting = true;
            window.location.href = loginUrl;
        } else {
            callback(error, response);
        }
    });
};

function enableDataDogTracking(store: AppStore) {
    datadogLogs.init({
        clientToken: 'pub9a94ebb002f105ff44d8e427b6549775',
        site: 'datadoghq.com',
        service: 'cbioportalinternal',
        forwardErrorsToLogs: true,
        sessionSampleRate: 100,
    } as any);

    const match = [
        /filtered-samples/,
        /clinical-data-bin-counts/,
        /generic-assay-data-bin-counts/,
        /mutated-genes/,
        /molecular-profile-sample-counts/,
        /cna-genes/,
        /structuralvariant-genes/,
        /clinical-data-counts/,
        /sample-lists-counts/,
        /clinical-data-density-plot/,
        /clinical-data-violin-plots/,
        /genomic-data-counts/,
        /mutation-data-counts/,
        /clinical-event-type-counts/,
        /treatments\/patient-counts/,
        /treatments\/sample-counts/,
        /genomic-data-bin-counts/,
        /clinical-event-type-counts/,
    ];

    const oldRequest = (internalClient as any).request;
    (internalClient as any).request = function(...args: any) {
        try {
            let url = args[1];

            if (Object.keys(args[4]).length) {
                url = url + '?' + $.param(args[4]);
            }

            const data = args[2];

            const studyIds = data.studyIds || data.studyViewFilter.studyIds;

            const appName = store.serverConfig.app_name;

            if (studyIds.length < 4 && _.some(match, re => re.test(url))) {
                const hash = hashString(url + JSON.stringify(toJS(data)));
                datadogLogs.logger.info('study view request', {
                    url,
                    data,
                    hash,
                    appName,
                });
            }
        } catch (ex) {
            // fail silently
        }

        return oldRequest.apply(this, args);
    };
}

//
browserWindow.routingStore = routingStore;

let render = (key?: number) => {
    if (!getBrowserWindow().navigator.webdriver) initializeTracking();

    if (stores.appStore?.serverConfig.user_display_name === 'servcbioportal') {
        getLoadConfig().hide_login = true;
        browserWindow.isMSKCIS = true;
    }

    // @ts-ignore
    if (stores.appStore.serverConfig.app_name === 'public-portal') {
        stores.appStore.serverConfig.download_custom_buttons_json = `[
        {
            "id": "avm",
            "name": "AVM for cBioPortal",
            "tooltip": "Launch AVM for cBioPortal with data (copied to clipboard)",
            "image_src": "https://aquminmedical.com/images/content/AquminLogoSimple.png",
            "required_user_agent": "Win",
            "required_installed_font_family": "AVMInstalled",
            "url_format": "avm://?importclipboard&-AutoMode=true&-ProjectNameHint={studyName}&-ImportDataLength={dataLength}",
            "visualize_title": "AVM for cBioPortal (Windows)",
            "visualize_href": "https://bit.ly/avm-cbioportal",
            "visualize_description": "Windows software that loads data into 3D Landscapes for interactive visualization and pathway analysis. Download table data directly from cBioPortal.",
            "visualize_image_src": "https://github.com/user-attachments/assets/5c17f5ed-0357-4ffa-a6e1-5a9d435dd3c5"
        }
    ]`;
    }

    const rootNode = document.getElementById('reactRoot');

    ReactDOM.render(
        <Provider {...stores}>
            <Router history={syncedHistory}>
                {/*@ts-ignore*/}
                <Container location={routingStore.location} />
            </Router>
        </Provider>,
        rootNode
    );
};

//@ts-ignore
if (__DEBUG__ && module.hot) {
    const renderApp = render;
    render = () => renderApp(Math.random());

    //@ts-ignore
    module.hot.accept('./routes', () => render());
}

async function loadCustomJs() {
    if (!getServerConfig().custom_js_urls) {
        return Promise.resolve();
    }
    const customJsFiles = getServerConfig().custom_js_urls.split(',');
    return Promise.all(
        Object.values(customJsFiles).map(
            (customJsFileUrl: string) =>
                new Promise<void>((resolve, reject) => {
                    load(customJsFileUrl, (err: any) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                })
        )
    );
}

const hardcodedServerConfig = {
    skin_data_sets_header:
        'The table below lists the number of available samples per cancer study and data type. It also provides links to download the data for each study. For alternative ways of downloading, see the <a href="https://docs.cbioportal.org/5.2-datasets/downloads#introduction">Download Documentation</a>.',
    digitalslidearchive_iframe_url:
        'http://cancer.digitalslidearchive.net/index_mskcc.php?slide_name=',
    skin_email_contact: 'cbioportal@googlegroups.com',
    enable_persistent_cache: true,
    skin_blurb: '',
    oncoKbTokenDefined: true,
    skin_show_data_tab: true,
    digitalslidearchive_meta_url:
        'http://cancer.digitalslidearchive.net/local_php/get_slide_list_from_db_groupid_not_needed.php?slide_name_filter=',
    show_civic: true,
    skin_example_study_queries:
        'tcga pancancer atlas\ntcga -legacy -pancancer\ntcga or icgc\nmsk-impact\n-"cell line"\nbreast\nesophageal OR stomach\nprostate msk\nserous',
    skin_documentation_about: 'About-Us.md',
    installation_map_url: 'https://installationmap.netlify.app/',
    skin_login_contact_html:
        'If you think you have received this message in error, please contact us at <a style="color:#FF0000" href="mailto:cbioportal-access@cbio.mskcc.org">cbioportal-access@cbio.mskcc.org</a>',
    skin_show_study_help_button: true,
    bitly_access_token: '7fdf316a43437f8a6291b99963b371d0229d4b2e',
    skin_right_nav_show_web_tours: false,
    enable_cross_study_expression:
        '(studies)=>(studies.filter(s=>/pan_can_atlas/.test(s.studyId) === false).length === 0 || studies.filter(s=>/tcga_gdc/.test(s.studyId) === false).length === 0)',
    skin_hide_download_controls: 'show',
    show_mdacc_heatmap: true,
    skin_show_news_tab: true,
    skin_authorization_message:
        'Welcome to cBioPortal - sign in with your Google or Microsoft account to store your <a href="https://www.cbioportal.org/tutorials#virtual-studies" target="_blank">virtual studies</a> and <a href="https://www.cbioportal.org/tutorials#group-comparison" target="_blank">groups</a>. This will allow you to access your studies and groups from any computer, and cBioPortal will also remember your study view charts preferences for each study (i.e. order of the charts, type of charts and visibility). Login is optional and not required to access any of the other features of cBioPortal.',
    skin_documentation_baseurl:
        'https://raw.githubusercontent.com/cBioPortal/cbioportal/master/docs/',
    oncoprint_defaultview: 'patient',
    frontendConfigOverride:
        "{\"custom_tabs\": [{\"title\": \"Single Cell Data (beta)\",\"id\": \"customTab1\",\"location\": \"PATIENT_PAGE\",\"mountCallbackName\": \"renderCustomTabSingleCellData\",\"pathsToJs\": [\"https://single-cell.cbioportal.org/singlecelldata/custom-tabs/resources/single_cell_data.js\"],\"showWithMultipleStudies\": false,\"unmountOnHide\": false,\"hideAsync\":\"() => {var includedStudyIds = ['gbm_cptac_2021'];var includedCaseIds = ['C3L-02705','C3L-03968','C3N-02783','C3N-01798','C3N-03186','C3L-03405','C3N-03184','C3N-02769','C3N-02190','C3N-01334','C3N-03188','C3N-01815','C3N-01814','C3N-00662','C3N-02784','C3N-02188','C3N-02181','C3N-01816'];var currentStudyId = window.patientViewPageStore.studyId;var currentCaseId = urlWrapper.query.caseId;return Promise.resolve(includedStudyIds.includes(currentStudyId) && includedCaseIds.includes(currentCaseId));}\"}]}",
    dat_method: 'none',
    skin_patientview_filter_genes_profiled_all_samples: false,
    google_analytics_profile_id: 'G-5260NDGD6Z',
    google_tag_manager_id: 'GTM-TLXCGKK',
    skin_data_sets_footer:
        'Data sets of published studies were curated from literature. Data sets of legacy TCGA studies were downloaded from the <a href="http://gdac.broadinstitute.org">Broad Institute Firehose</a>, last updated 1/28/2016.',
    base_url: 'http://localhost:8082',
    skin_show_tools_tab: true,
    app_name: 'public-portal',
    user_email_address: 'anonymousUser',
    skin_documentation_news: 'News.md',
    skin_right_nav_whats_new_blurb: '',
    skin_show_donate_button: true,
    show_transcript_dropdown: true,
    enable_request_body_gzip_compression: true,
    skin_documentation_oql: 'Onco-Query-Language.md',
    app_version: '2026-02-10T17:23:25Z',
    skin_title: 'cBioPortal for Cancer Genomics',
    skin_right_logo: '',
    skin_footer: '',
    oncokb_public_api_url: 'https://www.oncokb.org/api/v1',
    skin_right_nav_show_whats_new: true,
    study_download_url: 'https://datahub.assets.cbioportal.org/',
    oncoprint_hotspots_default: true,
    show_genomenexus_annotation_sources: 'mutation_assessor',
    show_oncokb: true,
    skin_show_r_matlab_tab: false,
    feature_study_export: false,
    sessionServiceEnabled: true,
    skin_documentation_markdown: true,
    skin_quick_select_buttons:
        'TCGA PanCancer Atlas Studies#*pan_can_atlas*;Curated set of non-redundant studies|238 studies that are manually curated including TCGA and non-TCGA studies with no overlapping samples#acbc_mskcc_2015,acc_tcga_pan_can_atlas_2018,acyc_fmi_2014,acyc_mda_2015,acyc_mskcc_2013,acyc_sanger_2013,all_phase2_target_2018_pub,all_stjude_2016,aml_target_2018_pub,ampca_bcm_2016,angs_project_painter_2018,bfn_duke_nus_2015,blca_bgi,blca_cornell_2016,blca_dfarber_mskcc_2014,blca_mskcc_solit_2012,blca_mskcc_solit_2014,blca_tcga_pan_can_atlas_2018,brca_bccrc,brca_broad,brca_igr_2015,brca_mbcproject_wagle_2017,brca_metabric,brca_sanger,brca_tcga_pan_can_atlas_2018,ccrcc_irc_2014,ccrcc_utokyo_2013,cesc_tcga_pan_can_atlas_2018,chol_jhu_2013,chol_nccs_2013,chol_nus_2012,chol_tcga_pan_can_atlas_2018,cll_iuopa_2015,cllsll_icgc_2011,coadread_dfci_2016,coadread_genentech,coadread_mskcc,coadread_tcga_pan_can_atlas_2018,cscc_dfarber_2015,cscc_hgsc_bcm_2014,ctcl_columbia_2015,desm_broad_2015,dlbc_tcga_pan_can_atlas_2018,dlbcl_dfci_2018,dlbcl_duke_2017,egc_tmucih_2015,es_dfarber_broad_2014,es_iocurie_2014,esca_broad,esca_tcga_pan_can_atlas_2018,escc_icgc,escc_ucla_2014,gbc_shanghai_2014,gbm_tcga_pan_can_atlas_2018,glioma_msk_2018,hcc_inserm_fr_2015,hcc_msk_venturaa_2018,hnsc_broad,hnsc_jhu,hnsc_mdanderson_2013,hnsc_tcga_pan_can_atlas_2018,kich_tcga_pan_can_atlas_2018,kirc_bgi,kirc_tcga_pan_can_atlas_2018,kirp_tcga_pan_can_atlas_2018,laml_tcga_pan_can_atlas_2018,lcll_broad_2013,lgg_tcga_pan_can_atlas_2018,lgg_ucsf_2014,liad_inserm_fr_2014,lihc_amc_prv,lihc_riken,lihc_tcga_pan_can_atlas_2018,luad_broad,luad_tcga_pan_can_atlas_2018,luad_tsp,lusc_tcga_pan_can_atlas_2018,mbl_broad_2012,mbl_pcgp,mbl_sickkids_2016,mcl_idibips_2013,mds_tokyo_2011,mel_tsam_liang_2017,meso_tcga_pan_can_atlas_2018,mixed_allen_2018,mixed_pipseq_2017,mm_broad,mpnst_mskcc,mrt_bcgsc_2016,nbl_amc_2012,nbl_target_2018_pub,nbl_ucologne_2015,nccrcc_genentech_2014,nepc_wcm_2016,nhl_bcgsc_2011,nhl_bcgsc_2013,npc_nusingapore,nsclc_unito_2016,ov_tcga_pan_can_atlas_2018,paac_jhu_2014,paad_qcmg_uq_2016,paad_tcga_pan_can_atlas_2018,paad_utsw_2015,pact_jhu_2011,panet_arcnet_2017,panet_jhu_2011,panet_shanghai_2013,pcnsl_mayo_2015,pcpg_tcga_pan_can_atlas_2018,pediatric_dkfz_2017,plmeso_nyu_2015,prad_broad,prad_eururol_2017,prad_fhcrc,prad_mich,prad_mpcproject_2018,prad_mskcc,prad_mskcc_cheny1_organoids_2014,prad_tcga_pan_can_atlas_2018,rms_nih_2014,rt_target_2018_pub,sarc_mskcc,sarc_tcga_pan_can_atlas_2018,scco_mskcc,sclc_cancercell_gardner_2017,sclc_jhu,sclc_ucologne_2015,skcm_broad,skcm_broad_brafresist_2012,skcm_tcga_pan_can_atlas_2018,skcm_vanderbilt_mskcc_2015,skcm_yale,stad_pfizer_uhongkong,stad_tcga_pan_can_atlas_2018,stad_utokyo,summit_2018,tet_nci_2014,tgct_tcga_pan_can_atlas_2018,thca_tcga_pan_can_atlas_2018,thym_tcga_pan_can_atlas_2018,uccc_nih_2017,ucec_tcga_pan_can_atlas_2018,ucs_jhu_2014,ucs_tcga_pan_can_atlas_2018,um_qimr_2016,urcc_mskcc_2016,utuc_mskcc_2015,uvm_tcga_pan_can_atlas_2018,vsc_cuk_2018,wt_target_2018_pub,acyc_jhu_2016,prostate_dkfz_2018,histiocytosis_cobi_msk_2019,utuc_cornell_baylor_mdacc_2019,prad_su2c_2019,cll_broad_2015,coad_cptac_2019,brca_mskcc_2019,acc_2019,pptc_2019,prad_msk_2019,ccrcc_dfci_2019,mpn_cimr_2013,nsclc_tracerx_2017,mnm_washu_2016,bcc_unige_2016,coad_caseccc_2015,metastatic_solid_tumors_mich_2017,aml_ohsu_2018,ihch_smmu_2014,nsclc_mskcc_2018,skcm_dfci_2015,skcm_mskcc_2014,mel_ucla_2016,utuc_msk_2019,gbm_columbia_2019,stad_oncosg_2018,brca_smc_2018,luad_oncosg_2020,angs_painter_2020,mel_dfci_2019,lung_smc_2016,utuc_igbmc_2021,cscc_ucsf_2021,chol_icgc_2017,hccihch_pku_2019,ihch_ismms_2015,mbl_dkfz_2017,pan_origimed_2020,crc_nigerian_2020,difg_glass_2019,pancan_pcawg_2020,ucec_cptac_2020,paad_cptac_2021,lusc_cptac_2021,luad_cptac_2020,gbm_cptac_2021,brca_cptac_2020,brain_cptac_2020,mpcproject_broad_2021,brca_hta9_htan_2022,lung_nci_2022,mds_iwg_2022,biliary_tract_summit_2022,pog570_bcgsc_2020,hcc_meric_2021,prostate_pcbm_swiss_2019,ucec_ccr_cfdna_msk_2022,ucec_ccr_msk_2022,mixed_selpercatinib_2020,lgsoc_mapk_msk_2022,mng_utoronto_2021,blca_bcan_hcrn_2022,aml_ohsu_2022,coad_silu_2022,stmyec_wcm_2022,bladder_columbia_msk_2018,sarcoma_msk_2022,cll_broad_2022,coadread_cass_2020,prad_msk_mdanderson_2023,crc_hta11_htan_2021,hcc_clca_2024,brca_fuscc_2020,brca_dfci_2020,msk_chord_2024,chl_sccc_2023,normal_skin_fibroblast_2024,normal_skin_keratinocytes_2024,normal_skin_melanocytes_2024,ovary_geomx_gray_foundation_2024,sarcoma_ucla_2024,crc_sysucc_2022,ccle_genentech_2014,sft_sysucc_2023,luad_cas_2020,brca_dldccc_2022,crc_orion_2024',
    oncoprintOncoKbHotspotsDefault: 'undefined',
    skin_right_nav_show_examples: true,
    authenticationMethod: 'optional_oauth2',
    quick_search_enabled: true,
    skin_show_web_api_tab: true,
    user_display_name: 'anonymousUser',
    skin_show_tutorials_tab: true,
    skin_show_about_tab: true,
    studyview_max_samples_selected: '500000',
    skin_show_faqs_tab: true,
    skin_show_tweet_button: true,
    skin_documentation_faq: 'user-guide/faq.md',
    default_cross_cancer_study_session_id: '5c8a7d55e4b046111fee2296',
    genomenexus_url: 'https://v1.genomenexus.org',
    disabled_tabs: '',
    show_cbioportal: true,
    frontendUrl: 'https://frontend.cbioportal.org/',
    oncoprint_oncokb_default: true,
    priority_studies:
        'PanCancer Studies#msk_chord_2024,msk_impact_2017,metastatic_solid_tumors_mich_2017,mixed_allen_2018,summit_2018,tmb_mskcc_2018,ntrk_msk_2019,msk_ch_2020,pan_origimed_2020,pancan_pcawg_2020,msk_met_2021;Pediatric Cancer Studies#pptc_2019,all_phase2_target_2018_pub,rt_target_2018_pub,wt_target_2018_pub,aml_target_2018_pub,nbl_target_2018_pub,pediatric_dkfz_2017,mixed_pipseq_2017,all_stjude_2016,all_stjude_2015,es_dfarber_broad_2014,es_iocurie_2014,mbl_pcgp,pancan_mappyacts_2022,chl_sccc_2023,pancan_pdx_uthsa_2023;Immunogenomic Studies#gbm_columbia_2019,skcm_dfci_2015,skcm_mskcc_2014,mel_ucla_2016,nsclc_mskcc_2018,nsclc_mskcc_2015,tmb_mskcc_2018,ccrcc_dfci_2019;Cell lines#ccle_broad_2019,cellline_ccle_broad,cellline_nci60,ccle_broad_2025,ccle_genentech_2014;PreCancerous/Healthy Studies#crc_hta11_htan_2021,ovary_geomx_gray_foundation_2024,normal_skin_fibroblast_2024,normal_skin_keratinocytes_2024,normal_skin_melanocytes_2024',
    skin_right_nav_show_testimonials: true,
    clickhouse_mode: true,
    show_hotspot: true,
    skin_login_saml_registration_html: 'Sign in with MSK',
    skin_right_nav_show_data_sets: true,
};

$(document).ready(async () => {
    // we show blank page if the window.name is "blank"
    if (window.name === 'blank') {
        return;
    }

    // we use rawServerConfig (written by JSP) if it is present
    // or fetch from config service if not
    // need to use jsonp, so use jquery
    let initialServerConfig =
        browserWindow.rawServerConfig || hardcodedServerConfig;

    getBrowserWindow().onMobxPromise = onMobxPromise;

    initializeServerConfiguration(initialServerConfig);

    initializeGenericAssayServerConfig();

    initializeAPIClients();

    initializeAppStore(stores.appStore);

    await loadCustomJs();

    render();

    stores.appStore.setAppReady();
});

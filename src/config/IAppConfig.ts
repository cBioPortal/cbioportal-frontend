export interface IAppConfig {
    apiRoot?: string;
    baseUrl?:string;
    authLogoutUrl?: string;
    authUserName?: string;
    authGoogleLogin?: string;
    configurationServiceUrl?: string;
    frontendUrl?: string;
    customTabs?:any;
    serverConfig:IServerConfig;

    //skinExampleStudyQueries: string[]; // in query the example searches
    //priorityStudies: PriorityStudies;
    //disabledTabs?:string[],




    //googleAnalyticsProfile?: string;



    //maxTreeDepth: number;
    //priorityStudies: {
    //    'Shared institutional Data Sets': ['mskimpact', 'cellline_mskcc'],
    //    'Priority Studies': ['blca_tcga_pub', 'coadread_tcga_pub', 'brca_tcga_pub2015'], // for demo
    //},

    //showCivic?: boolean;
    //showHotspot?: boolean;
    //showMyCancerGenome?: boolean;
    //showOncoKB?: boolean;
    //oncoKBApiUrl?: string;
    //showGenomeNexus?: boolean;
    //genomeNexusApiUrl?: string;
    studiesWithGermlineConsentedSamples?:string[];
    isoformOverrideSource?: string;
    // enableDarwin?: boolean;
    // appVersion?: string;

    // skinBlurb?: string; // text on main page
    // skinDatasetHeader?: string; // header on dataset page
    // skinDatasetFooter?: string;
    // skinRightNavShowDatasets?: boolean;
    // skinRightNavShowExamples?: boolean;
    // skinRightNavShowTestimonials?: boolean;
    // skinRightNavExamplesHTML?: string;
    // skinRightNavWhatsNewBlurb?: string;
    // skinRightLogo?: string;
    // skinShowDataSetsTab?: boolean;
    // skinShowWebAPITab?: boolean;
    // skinShowRmatLABTab?: boolean;
    // skinShowTutorialsTab?: boolean;
    // skinShowNewsTab?: boolean;
    // skinShowToolsTab?: boolean;
    // skinShowAboutTab?: boolean;
    // skinShowFAQSTab?: boolean;

    //userEmailAddress?: string;
    //querySetsOfGenes?: {"id": string, "genes":string[]}[];
    // labels to be displayed in oncoprint "Mutation color" menu for custom annotation of driver and passenger mutations in the oncoprint.
    // Set any of these properties to enable the respective menu options in oncoprint:
    //oncoprintCustomDriverAnnotationBinaryMenuLabel?:string;
    //oncoprintCustomDriverAnnotationTiersMenuLabel?:string;
    // set this to false to disable the automatic selection of the custom driver/passenger mutations annotation (binary) in the oncoprint
    // when custom annotation data is present.
    //oncoprintCustomDriverAnnotationDefault?:boolean;
    // set this to false to disable the automatic selection of the custom tiers in the oncoprint when custom annotation data is present. By default
    // this property is true.
    //oncoprintCustomDriverTiersAnnotationDefault?:boolean;
    // OncoKB and Hotspots are automatically selected as annotation source. If you want to disable them, set the following property to "disable". If you
    // want them to be selected only if there are no custom annotation driver and passenger mutations, type "custom".
    //oncoprintOncoKbHotspotsDefault?:"disable"|"custom";
    // Select hide VUS by default
    //oncoprintHideVUSDefault?:boolean;
    //sessionServiceIsEnabled?:boolean;
    //sessionServiceUrl?:string;

    //skinIsMarkdownDocumentation?:boolean;
    //skinDocumentationBaseUrl?: string;
    //skinFaqSourceURL?: string;
    //skinAboutSourceURL?: string;
    //skinNewsSourceURL?: string;
    //skinOQLSourceURL?: string;





}

export type PriorityStudies = {
    [category:string]: string[]
};

export type VirtualCohort = {
    id:string,
    name:string,
    description:string,
    samples:{sampleId:string, studyId:string}[],
    constituentStudyIds:string[]
};

export interface IServerConfig {

    "app_version": string|null;   // default: "1.0"
    "binary_custom_driver_annotation_menu_label": string|null; // default:
    "disabled_tabs": string|null;
    "civic_url": string|null;
    "oncoprint_custom_driver_annotation_default": boolean;
    "oncoprint_oncokb_hotspots_default": string | undefined;
    "genomenexus_url": string|null;
    "google_analytics_profile_id": string|null;
    "oncoprint_hide_vus_default": boolean;
    "mycancergenome_show": boolean | undefined;
    "oncokb_public_api_url": string|null;
    "digitalslidearchive_iframe_url": string|null;
    "digitalslidearchive_meta_url": string|null;
    "mdacc_heatmap_meta_url": string|null;
    "mdacc_heatmap_patient_url": string|null;
    "priority_studies": string|null;
    "show_hotspot": boolean | undefined;
    "show_oncokb": boolean;
    "show_civic": boolean;
    "show_genomenexus": boolean;
    "skin_documentation_about": string|null;
    "skin_documentation_baseurl": string|null;
    "skin_blurb": string|null;
    "skin_custom_header_tabs": string|null;
    "skin_data_sets_footer": string|null;
    "skin_data_sets_header": string|null;
    "skin_documentation_markdown": boolean;
    "skin_email_contact": string|null;
    "skin_example_study_queries": string|null;
    "skin_examples_right_column_html": string|null;
    "skin_documentation_faq": string|null;
    "skin_footer": string|null;
    "skin_login_contact_html": string|null;
    "skin_login_saml_registration_html": string|null;
    "skin_documentation_news": string|null;
    "skin_documentation_oql": string|null;
    "skin_query_max_tree_depth": string;
    "skin_right_logo": string|null;
    "skin_right_nav_show_data_sets": boolean;
    "skin_right_nav_show_examples": boolean;
    "skin_right_nav_show_testimonials": boolean;
    "skin_right_nav_whats_new_blurb": string|null;
    "skin_show_about_tab": boolean;
    "skin_show_data_tab": boolean;
    "skin_show_faqs_tab": boolean;
    "skin_show_news_tab":boolean;
    "skin_show_r_matlab_tab": boolean;
    "skin_show_tools_tab": boolean;
    "skin_show_tutorials_tab": boolean;
    "skin_show_web_api_tab": boolean;
    "skin_title": string|null;
    "skin_authorization_message": string|null;
    "mdacc_heatmap_study_meta_url": string|null;
    "mdacc_heatmap_study_url": string|null;
    "oncoprint_custom_driver_annotation_tiers_menu_label": string|null;
    "enable_darwin": boolean;
    "query_sets_of_genes": string|null;
    "base_url": string|null;
    "user_email_address": string;
    "session_service_url": string;
    "session_url_length_threshold":string;

}

//
// const ServerCongfigDefaults: Partial<IServerConfig> = {
//     app_version:"1.0",
//     civic_url:"https://civicdb.org/api/",
//     genomenexus_url:"v1.genomenexus.org",
//     mycancergenome_show:false,
//     oncoprint_oncokb_hotspots_default:undefined,
//     oncoprint_hide_vus_default:false,
//     oncokb_public_api_url:"oncokb.org/api/v1",
//     show_hotspot:true,
//     show_oncokb:true,
//     show_civic:false,
//     skin_authorization_message:"Access to this portal is only available to authorized users.",
//     skin_documentation_about:"About-Us.md",
//     skin_documentation_baseurl:"https://raw.githubusercontent.com/cBioPortal/cbioportal/master/docs/",
//     skin_documentation_markdown:true,
//     skin_email_contact:"cbioportal at googlegroups dot com",
//     skin_documentation_faq:"FAQ.md",
//     skin_login_saml_registration_html:"Sign in with MSK",
//     skin_documentation_news:"News.md",
//     skin_documentation_oql:"Onco-Query-Language.md",
//     skin_query_max_tree_depth:"3",
//     skin_right_nav_show_data_sets:true,
//     skin_right_nav_show_examples:true,
//     skin_right_nav_show_testimonials:true,
//     skin_show_about_tab:true,
//     skin_show_data_tab:true,
//     skin_show_faqs_tab:true,
//     skin_show_news_tab:true,
//     skin_show_r_matlab_tab:true,
//     skin_show_tools_tab:true,
//     skin_show_web_api_tab:true,
//     skin_title:"cBioPortal for Cancer Genomics",
//
//     skin_blurb:`The cBioPortal for Cancer Genomics provides
//         <b>visualization</b>, <b>analysis</b> and <b>download</b> of large-scale cancer genomics data sets.
//         <p>Please adhere to <u><a href=\"http://cancergenome.nih.gov/abouttcga/policies/publicationguidelines\">
//         the TCGA publication guidelines</a></u> when using TCGA data in your publications.</p>
//         <p><b>Please cite</b> <a href=\"http://www.ncbi.nlm.nih.gov/pubmed/23550210\">Gao
//         et al. <i>Sci. Signal.</i> 2013</a> &amp;
//         <a href=\"http://cancerdiscovery.aacrjournals.org/content/2/5/401.abstract\">
//         Cerami et al. <i>Cancer Discov.</i> 2012</a> when publishing results based on cBioPortal.</p>`,
//
//     skin_data_sets_footer:`Data sets of TCGA studies were downloaded from Broad
//             Firehose (http://gdac.broadinstitute.org) and updated monthly. In some studies, data sets were from the
//             TCGA working groups directly.`,
//     skin_data_sets_header:`The portal currently contains data from the following
//             cancer genomics studies.  The table below lists the number of available samples per data type and tumor.`,
//     skin_example_study_queries: `tcga pancancer atlas\n
//                                      tcga provisional\n
//                                      tcga -provisional -pancancer\n
//                                      tcga or icgc\n
//                                      msk-impact\n
//                                      -\"cell line\"\n
//                                      breast\n
//                                      esophageal OR stomach\n
//                                      prostate msk\n
//                                      serous`,
//
//     skin_footer: ` | <a href=\\"http://www.mskcc.org/mskcc/html/44.cfm\\">MSKCC</a> | <a href=\\"http://cancergenome.nih.gov/\\">TCGA</a>`,
//
//     skin_login_contact_html: `If you think you have received this message in
//             error, please contact us at <a style="color:#FF0000" href="mailto:cbioportal-access@cbio.mskcc.org">
//             cbioportal-access@cbio.mskcc.org</a>`,
//
//     enable_darwin:false,
//
//     session_url_length_threshold:"1990"
//}
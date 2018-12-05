export interface IAppConfig {
    apiRoot?: string;
    baseUrl?:string;
    configurationServiceUrl?: string;
    frontendUrl?: string;
    serverConfig:IServerConfig;
    hide_login?:boolean;
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

export type StudyView = {
    tableAttrs: string[]
    priority: { [id: string]: number }
};

export interface IServerConfig {
    "app_name": string | null;
    "app_version": string|null;   // default: "1.0"
    "authenticationMethod": string | undefined;
    "bitly_access_token": string|null;
    "binary_custom_driver_annotation_menu_label": string|null; // default:
    "disabled_tabs": string|null;
    "custom_tabs": any[];
    "oncoprint_custom_driver_annotation_default": boolean;
    "oncoprint_oncokb_hotspots_default": string | undefined;
    "genomenexus_url": string|null;
    "mygene_info_url": string|null;
    "g2s_url": string|null;
    "google_analytics_profile_id": string|null;
    "isoformOverrideSource" : string;
    "oncoprint_hide_vus_default": boolean;
    "mycancergenome_show": boolean | undefined;
    "oncokb_public_api_url": string|null;
    "digital_slide_archive_iframe_url": string|null;
    "digital_slide_archive_meta_url": string|null;
    "mdacc_heatmap_meta_url": string|null;
    "mdacc_heatmap_patient_url": string|null;
    "pubmed_url":string | null;
    "priority_studies": string|null;
    "api_cache_limit":number;
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
    "skin_description": string;
    "skin_email_contact": string;
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
    "skin_show_tweet_button": boolean;
    "skin_show_tissue_image_tab": boolean;
    "skin_title": string;
    "skin_authorization_message": string|null;
    "study_view": StudyView;
    "uniprot_id_url": string|null,
    "studiesWithGermlineConsentedSamples":string[]|undefined;
    "mdacc_heatmap_study_meta_url": string|null;
    "mdacc_heatmap_study_url": string|null;
    "oncoprint_custom_driver_annotation_tiers_menu_label": string|null;
    "enable_darwin": boolean;
    "query_sets_of_genes": string|null;
    "base_url": string|null;
    "user_email_address": string;
    "sessionServiceEnabled": boolean;
    "session_url_length_threshold":string;

}

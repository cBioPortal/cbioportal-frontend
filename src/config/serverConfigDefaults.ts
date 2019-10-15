import { IServerConfig } from './IAppConfig';

const ServerConfigDefaults: Partial<IServerConfig> = {
    app_version: '1.0',
    api_cache_limit: 450,
    dat_uuid_revoke_other_tokens: true,
    dat_method: 'none',
    disabled_tabs: '',
    genomenexus_url: 'https://www.genomenexus.org',
    g2s_url: 'https://g2s.genomenexus.org',
    mycancergenome_show: false,

    digital_slide_archive_iframe_url:
        'https://cancer.digitalslidearchive.org/index.html?patientId=',
    digital_slide_archive_meta_url:
        'https://api.digitalslidearchive.org/api/v1/tcga/image?caseName=',

    mdacc_heatmap_patient_url:
        'https://bioinformatics.mdanderson.org/participant2maps?participant=',
    mdacc_heatmap_study_meta_url:
        'https://bioinformatics.mdanderson.org/study2url?studyid=',
    mdacc_heatmap_study_url:
        'https:// bioinformatics.mdanderson.org/TCGA/NGCHMPortal/?',

    mygene_info_url:
        'https://mygene.info/v3/gene/<%= entrezGeneId %>?fields=uniprot',

    oncoprint_oncokb_default: true,
    oncoprint_hotspots_default: true,
    oncoprint_hide_vus_default: false,
    oncokb_public_api_url: 'oncokb.org/api/v1',

    pubmed_url: 'https://www.ncbi.nlm.nih.gov/pubmed/<%=pmid%>',

    isoformOverrideSource: 'uniprot',
    show_hotspot: true,
    show_oncokb: true,
    show_civic: false,
    skin_description:
        'The cBioPortal for Cancer Genomics provides visualization, analysis and download of large-scale cancer genomics data sets',
    show_genomenexus: true,
    skin_authorization_message:
        'Access to this portal is only available to authorized users.',
    skin_documentation_about: 'About-Us.md',
    skin_documentation_baseurl:
        'https://raw.githubusercontent.com/cBioPortal/cbioportal/master/docs/',
    skin_documentation_markdown: true,
    skin_email_contact: 'cbioportal at googlegroups dot com',
    skin_documentation_faq: 'FAQ.md',
    skin_login_saml_registration_html: 'Sign in with MSK',
    skin_documentation_news: 'News.md',
    skin_documentation_oql: 'Onco-Query-Language.md',
    skin_query_max_tree_depth: '3',
    skin_right_nav_show_data_sets: true,
    skin_right_nav_show_examples: true,
    skin_right_nav_show_testimonials: true,
    skin_right_nav_show_whats_new: true,
    skin_citation_rule_text:
        'Please cite: <a href="http://cancerdiscovery.aacrjournals.org/content/2/5/401.abstract" target="_blank">Cerami et al., 2012</a> &amp; <a href="http://www.ncbi.nlm.nih.gov/pubmed/23550210" target="_blank">Gao et al., 2013</a>',
    skin_show_about_tab: true,
    skin_show_data_tab: true,
    skin_show_faqs_tab: true,
    skin_show_news_tab: true,
    skin_show_r_matlab_tab: true,
    skin_show_tools_tab: true,
    skin_show_web_api_tab: true,
    skin_show_tweet_button: false,
    skin_show_tissue_image_tab: true,
    quick_search_enabled: false,
    default_cross_cancer_study_list:
        'laml_tcga_pan_can_atlas_2018,acc_tcga_pan_can_atlas_2018,blca_tcga_pan_can_atlas_2018,' +
        'lgg_tcga_pan_can_atlas_2018,brca_tcga_pan_can_atlas_2018,cesc_tcga_pan_can_atlas_2018,chol_tcga_pan_can_atlas_2018,' +
        'coadread_tcga_pan_can_atlas_2018,dlbc_tcga_pan_can_atlas_2018,esca_tcga_pan_can_atlas_2018,gbm_tcga_pan_can_atlas_2018,' +
        'hnsc_tcga_pan_can_atlas_2018,kich_tcga_pan_can_atlas_2018,kirc_tcga_pan_can_atlas_2018,kirp_tcga_pan_can_atlas_2018,' +
        'lihc_tcga_pan_can_atlas_2018,luad_tcga_pan_can_atlas_2018,lusc_tcga_pan_can_atlas_2018,meso_tcga_pan_can_atlas_2018,' +
        'ov_tcga_pan_can_atlas_2018,paad_tcga_pan_can_atlas_2018,pcpg_tcga_pan_can_atlas_2018,prad_tcga_pan_can_atlas_2018,' +
        'sarc_tcga_pan_can_atlas_2018,skcm_tcga_pan_can_atlas_2018,stad_tcga_pan_can_atlas_2018,' +
        'tgct_tcga_pan_can_atlas_2018,thym_tcga_pan_can_atlas_2018,thca_tcga_pan_can_atlas_2018,ucs_tcga_pan_can_atlas_2018,' +
        'ucec_tcga_pan_can_atlas_2018,uvm_tcga_pan_can_atlas_2018',
    default_cross_cancer_study_list_name: 'TCGA PanCancer Atlas studies',
    skin_title: 'cBioPortal for Cancer Genomics',

    skin_data_sets_footer: `Data sets of TCGA studies were downloaded from Broad 
            Firehose (http://gdac.broadinstitute.org) and updated monthly. In some studies, data sets were from the 
            TCGA working groups directly.`,
    skin_data_sets_header: `The portal currently contains data from the following 
            cancer genomics studies.  The table below lists the number of available samples per data type and tumor.`,

    skin_example_study_queries: `tcga pancancer atlas\n
                                     tcga provisional\n
                                     tcga -provisional -pancancer\n
                                     tcga or icgc\n
                                     msk-impact\n
                                     -\"cell line\"\n
                                     breast\n
                                     esophageal OR stomach\n
                                     prostate msk\n
                                     serous`,

    skin_login_contact_html: `If you think you have received this message in
            error, please contact us at <a style="color:#FF0000" href="mailto:cbioportal-access@cbio.mskcc.org">
            cbioportal-access@cbio.mskcc.org</a>`,

    enable_darwin: false,

    session_url_length_threshold: '1990',

    study_view: {
        tableAttrs: ['SAMPLE_CANCER_TYPE', 'SAMPLE_CANCER_TYPE_DETAILED'],
        priority: {
            SAMPLE_CANCER_TYPE: 3000,
            PATIENT_CANCER_TYPE: 3000,
            SAMPLE_CANCER_TYPE_DETAILED: 2000,
            PATIENT_CANCER_TYPE_DETAILED: 2000,
            OS_SURVIVAL: 400,
            DFS_SURVIVAL: 300,
            MUTATION_COUNT_CNA_FRACTION: 200,
            MUTATED_GENES_TABLE: 90,
            FUSION_GENES_TABLE: 85,
            CNA_GENES_TABLE: 80,
            CANCER_STUDIES: 70,
            SEQUENCED: 60,
            HAS_CNA_DATA: 50,
            PATIENT_SAMPLE_COUNT: 40,
            MUTATION_COUNT: 30,
            FRACTION_GENOME_ALTERED: 20,
            PATIENT_GENDER: 9,
            SAMPLE_GENDER: 9,
            PATIENT_SEX: 9,
            SAMPLE_SEX: 9,
            PATIENT_AGE: 9,
            SAMPLE_AGE: 9,
            PATIENT_RACE: 8,
            SAMPLE_RACE: 8,
            PATIENT_ETHNICITY: 8,
            SAMPLE_ETHNICITY: 8,
            SAMPLE_SAMPLE_TYPE: 8,
            PATIENT_SAMPLE_TYPE: 8,
            PATIENT_HISTOLOGY: 8,
            SAMPLE_HISTOLOGY: 8,
            SAMPLE_TUMOR_TYPE: 8,
            PATIENT_TUMOR_TYPE: 8,
            PATIENT_SUBTYPE: 8,
            SAMPLE_SUBTYPE: 8,
            PATIENT_TUMOR_SITE: 8,
            SAMPLE_TUMOR_SITE: 8,
        },
    },

    uniprot_id_url:
        'https://www.uniprot.org/uniprot/?query=accession:<%= swissProtAccession %>&format=tab&columns=entry+name',

    query_product_limit: 1000000,
};

export default ServerConfigDefaults;

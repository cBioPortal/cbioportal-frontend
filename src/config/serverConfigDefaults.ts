import {IServerConfig} from "./IAppConfig";

const ServerConfigDefaults: Partial<IServerConfig> = {
    app_version:"1.0",
    civic_url:"https://civicdb.org/api/",
    disabled_tabs:"",
    genomenexus_url:"v1.genomenexus.org",
    mycancergenome_show:false,
    oncoprint_oncokb_hotspots_default:undefined,
    oncoprint_hide_vus_default:false,
    oncokb_public_api_url:"oncokb.org/api/v1",
    show_hotspot:true,
    show_oncokb:true,
    show_civic:false,
    show_genomenexus:true,
    skin_authorization_message:"Access to this portal is only available to authorized users.",
    skin_documentation_about:"About-Us.md",
    skin_documentation_baseurl:"https://raw.githubusercontent.com/cBioPortal/cbioportal/master/docs/",
    skin_documentation_markdown:true,
    skin_email_contact:"cbioportal at googlegroups dot com",
    skin_documentation_faq:"FAQ.md",
    skin_login_saml_registration_html:"Sign in with MSK",
    skin_documentation_news:"News.md",
    skin_documentation_oql:"Onco-Query-Language.md",
    skin_query_max_tree_depth:"3",
    skin_right_nav_show_data_sets:true,
    skin_right_nav_show_examples:true,
    skin_right_nav_show_testimonials:true,
    skin_show_about_tab:true,
    skin_show_data_tab:true,
    skin_show_faqs_tab:true,
    skin_show_news_tab:true,
    skin_show_r_matlab_tab:true,
    skin_show_tools_tab:true,
    skin_show_web_api_tab:true,
    skin_title:"cBioPortal for Cancer Genomics",

    skin_blurb:`The cBioPortal for Cancer Genomics provides 
        <b>visualization</b>, <b>analysis</b> and <b>download</b> of large-scale cancer genomics data sets.
        <p>Please adhere to <u><a href=\"http://cancergenome.nih.gov/abouttcga/policies/publicationguidelines\"> 
        the TCGA publication guidelines</a></u> when using TCGA data in your publications.</p> 
        <p><b>Please cite</b> <a href=\"http://www.ncbi.nlm.nih.gov/pubmed/23550210\">Gao 
        et al. <i>Sci. Signal.</i> 2013</a> &amp; 
        <a href=\"http://cancerdiscovery.aacrjournals.org/content/2/5/401.abstract\">
        Cerami et al. <i>Cancer Discov.</i> 2012</a> when publishing results based on cBioPortal.</p>`,

    skin_data_sets_footer:`Data sets of TCGA studies were downloaded from Broad 
            Firehose (http://gdac.broadinstitute.org) and updated monthly. In some studies, data sets were from the 
            TCGA working groups directly.`,
    skin_data_sets_header:`The portal currently contains data from the following 
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

    skin_footer: ` | <a href=\\"http://www.mskcc.org/mskcc/html/44.cfm\\">MSKCC</a> | <a href=\\"http://cancergenome.nih.gov/\\">TCGA</a>`,

    skin_login_contact_html: `If you think you have received this message in
            error, please contact us at <a style="color:#FF0000" href="mailto:cbioportal-access@cbio.mskcc.org">
            cbioportal-access@cbio.mskcc.org</a>`,

    enable_darwin:false,

    session_url_length_threshold:"1990"

};

export default ServerConfigDefaults;


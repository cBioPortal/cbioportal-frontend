var assert = require('assert');
var expect = require('chai').expect;
var waitForOncoprint = require('./../specUtils').waitForOncoprint;
var setOncoprintMutationsMenuOpen = require('./../specUtils').setOncoprintMutationsMenuOpen;
var goToUrlAndSetLocalStorage = require('./../specUtils').goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('./../specUtils').waitForNetworkQuiet;
var sessionServiceIsEnabled = require('./../specUtils').sessionServiceIsEnabled;
var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");


describe("oncoprint screenshot tests", function() {
    it("coadread_tcga_pub with clinical and heatmap tracks", ()=>{
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=coadread_tcga_pub_rna_seq_mrna_median_Zscores&show_samples=false&clinicallist=0%2C2%2CMETHYLATION_SUBTYPE&heatmap_track_groups=coadread_tcga_pub_rna_seq_mrna_median_Zscores%2CKRAS%2CNRAS%2CBRAF&`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
        var res = browser.checkElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it("acc_tcga with clinical and heatmap tracks", ()=>{
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=acc_tcga&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=1&data_priority=0&case_set_id=acc_tcga_all&gene_list=SOX9%20RAN%20TNK2%20EP300%20PXN%20NCOA2%20AR%20NRIP1%20NCOR1%20NCOR2&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=acc_tcga_rna_seq_v2_mrna_median_Zscores&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=acc_tcga_rppa_Zscores&show_samples=false&clinicallist=0%2C1%2CMETASTATIC_DX_CONFIRMED_BY&heatmap_track_groups=acc_tcga_rna_seq_v2_mrna_median_Zscores%2CSOX9%2CRAN%2CTNK2%2CEP300%2CPXN%2CNCOA2%2CAR%2CNRIP1%2CNCOR1%2CNCOR2`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
        var res = browser.checkElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it("blca_tcga with clinical and heatmap tracks", ()=>{
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=blca_tcga_pub&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=1&data_priority=0&case_set_id=blca_tcga_pub_all&gene_list=SOX9%20RAN%20TNK2%20EP300%20PXN%20NCOA2%20AR%20NRIP1%20NCOR1%20NCOR2&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_rna_seq_mrna_median_Zscores&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_rppa_Zscores&show_samples=false&heatmap_track_groups=blca_tcga_pub_rna_seq_mrna_median_Zscores%2CSOX9%2CRAN%2CTNK2%2CEP300%2CPXN%2CNCOA2%2CAR%2CNRIP1%2CNCOR1%2CNCOR2&clinicallist=CANCER_TYPE_DETAILED%2CMETASTATIC_SITE_OTHER%2CNEW_TUMOR_EVENT_AFTER_INITIAL_TREATMENT`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
        var res = browser.checkElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it("msk_impact_2017 query STK11:HOMDEL MUT", ()=>{
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_Non-Small_Cell_Lung_Cancer&gene_list=STK11%253A%2520HOMDEL%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`);
        waitForOncoprint(20000);
        var res = browser.checkElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it("hcc_inserm_fr_2015 with genes including TERT - it should show orange promoter mutations in TERT", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=hcc_inserm_fr_2015&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=hcc_inserm_fr_2015_sequenced&gene_list=SOX9%2520RAN%2520TNK2%2520EP300%2520PXN%2520NCOA2%2520AR%2520NRIP1%2520NCOR1%2520NCOR2%2520TERT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=hcc_inserm_fr_2015_mutations`);
        waitForOncoprint(20000);
        var res = browser.checkElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it("msk_impact_2017 with SOS1 - SOS1 should be not sequenced", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement(".oncoprintContainer");
        assertScreenShotMatch(res);
    });
    it("msk_impact_2017 with ALK and SOS1 - SOS1 should be not sequenced", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=ALK%2520SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement(".oncoprintContainer");
        assertScreenShotMatch(res);
    });
    it("msk_impact_2017 with SOS1 with CNA profile - SOS1 should not be sequenced", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement(".oncoprintContainer");
        assertScreenShotMatch(res);
    });
    it("brca_tcga_pub with KRAS NRAS BRAF and methylation heatmap tracks", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=brca_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=brca_tcga_pub_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_pub_gistic&show_samples=false&heatmap_track_groups=brca_tcga_pub_methylation_hm27%2CKRAS%2CNRAS%2CBRAF%2CTP53%2CBRCA1%2CBRCA2`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(10000);
        var res = browser.checkElement(".oncoprintContainer");
        assertScreenShotMatch(res);
    });
    it("profiled in tracks in msk impact with 3 not profiled genes", function() {
        var url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=msk_impact_2017_cnaseq&gene_list=AKR1C1%2520AKR1C2%2520AKR1C4&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement(".oncoprintContainer");
        assertScreenShotMatch(res);
    });
    it("profiled in tracks in a combined study", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/results/oncoprint?session_id=5c38e4c0e4b05228701fb0c9&show_samples=false`);
        waitForOncoprint(10000);
        var res = browser.checkElement("#oncoprintDiv");
        assertScreenShotMatch(res);
    });
    it("profiled in tracks in multiple study with SOS1", function() {
        var url = `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=msk_impact_2017%2Cbrca_tcga_pub&case_set_id=all&data_priority=0&gene_list=SOS1&geneset_list=%20&tab_index=tab_visualize`;
        goToUrlAndSetLocalStorage(url);
        waitForOncoprint(20000);
        var res = browser.checkElement(".oncoprintContainer");
        assertScreenShotMatch(res);
    });
    it("multiple tracks with same gene", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=acc_tcga_pan_can_atlas_2018&case_set_id=acc_tcga_pan_can_atlas_2018_cnaseq&data_priority=0&gene_list=EGFR%253AAMP%253BEGFR%253AMUT%253B%2520PTEN%253B%2520EGFR%2520EGFR&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_pan_can_atlas_2018_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_pan_can_atlas_2018_mutations&tab_index=tab_visualize`);
        waitForOncoprint(10000);
        var res = browser.checkElement("#oncoprintDiv");
        assertScreenShotMatch(res);
    });
});

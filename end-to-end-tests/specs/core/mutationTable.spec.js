
var assertScreenShotMatch = require('../../lib/testUtils').assertScreenShotMatch;

var assert = require('assert');
var expect = require('chai').expect;
var goToUrlAndSetLocalStorage = require('../specUtils').goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('../specUtils').waitForNetworkQuiet;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

function waitForGenomeNexusAnnotation() {
    browser.pause(5000);// wait for annotation
}

describe('Mutation Table', function() {
    before(function(){
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);
    });

    describe('try getting exon and hgvsc info from genome nexus', ()=>{
        before(()=>{
            var url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&Z_SCORE_THRESHOLD=1.0&cancer_study_id=gbm_tcga_pub&cancer_study_list=gbm_tcga_pub&case_ids=&case_set_id=gbm_tcga_pub_sequenced&clinicallist=PROFILED_IN_gbm_tcga_pub_cna_rae&gene_list=TP53%20MDM2%20MDM4&gene_set_choice=user-defined_list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_pub_cna_rae&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_pub_mutations&show_samples=false`;

            goToUrlAndSetLocalStorage(url);
            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            browser.waitForVisible("tr:nth-child(1) [data-test=oncogenic-icon-image]",30000);
        });

        it.skip('should show the exon number after adding the exon column', ()=>{
            // check if 6 appears once in COSMIC column
            browser.waitForText('//*[text()="6"]',30000);
            var textValuesWith6 = browser.getText('//*[text()="6"]');
            assert.ok(textValuesWith6.length === 1);
            // click on column button
            browser.click("button*=Columns");
            // scroll down to activated "exon" selection
            browser.scroll(1000, 1000);
            // click "exon"
            browser.click('//*[text()="Exon"]');
            // check if three exact matches for 6 appear
            browser.waitUntil(() => {
                textValuesWith6 = browser.getText('//*[text()="6"]');
                return textValuesWith6.length > 1;
            }, 60000, "Exon data not in Exon column");
            textValuesWith6 = browser.getText('//*[text()="6"]');
            // 3 values from Exon column + 1 value from #Mut in Sample column
            assert.equal(textValuesWith6.length, 4);
        });

        it('should show more exon number after clicking "Show more"', ()=>{
            // click "show more" to add more data
            browser.click("button*=Show more");
            // check if 6 exact matches for 6 appear
            browser.waitUntil(() => {
                textValuesWith6 = browser.getText('//*[text()="6"]');
                // 4 values from Exon column + 1 value from #Mut in Sample column + 1 value from COSMIC column
                return textValuesWith6.length === 6;
            }, 60000, "Exon data not in Exon column after clikcing show more button");
        });

        it('should show the HGVSc data after adding the HGVSc column', ()=>{
            // reopen columns
            browser.click("button*=Columns");
            // click "HGVSc"
            browser.click('//*[text()="HGVSc"]');

            // check if "ENST00000269305.4:c.817C>T" appears
            browser.waitUntil(() => {
                var hgvscValues = browser.getText('//*[text()[contains(.,"ENST00000269305.4:c.817C>T")]]');
                return hgvscValues.length > 0;
            }, 60000, "HGVSc values not in hgvs column");
        });

        it('should show more HGVSc data after clicking "Show more"', ()=>{
            // click "show more" to add more data
            browser.click("button*=Show more");
            // check if "C>T" exact matches for 12 appear
            browser.waitUntil(() => {
                var hgvscValues = browser.getText('//*[text()[contains(.,"C>T")]]');
                return hgvscValues.length > 0;
            }, 60000, "HGVSc values not in hgvs column after clicking show more button");
        });
    });

    describe('try getting GNOMAD from genome nexus', ()=>{
        before(()=>{
            var url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016&case_set_id=nsclc_tcga_broad_2016_cnaseq&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations&tab_index=tab_visualize`;

            goToUrlAndSetLocalStorage(url);
            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            browser.waitForVisible("tr:nth-child(1) [data-test=oncogenic-icon-image]",300000);
        });

        it('should show the gnomad table after mouse over the frequency in gnomad column', ()=>{

            browser.waitForText('//*[text()="TCGA-78-7540-01"]',60000);
            // show the gnomad column
            browser.scroll(1000, 0);
            // click on column button
            browser.click("button*=Columns");
            // scroll down to activated "GNOMAD" selection
            browser.scroll(1000, 1000);
            // click "GNOMAD"
            browser.click('//*[text()="gnomAD"]');
            // find frequency
            const frequency = '[data-test2="TCGA-78-7540-01"][data-test="gnomad-column"]';
            browser.waitForExist(frequency, 60000);
            // wait for gnomad frequency show in the column
            browser.waitUntil(() => {
                var textFrequency = browser.getText(frequency);
                return textFrequency.length >= 1;
            }, 600000, "Frequency data not in Gnoamd column");
            // check if the column has 1.1e-5
            assert.equal(browser.getText(frequency), '1.1e-5');
            // mouse over the frequency
            browser.moveToObject(frequency,0,0);
            // wait for gnomad table showing up
            browser.waitForExist('[data-test="gnomad-table"]', 300000);
            // check if the first allele number appears
            let count = browser.getText('//*[text()[contains(.,"23986")]]');
            assert.ok(count.length > 0);
        });

    });

});

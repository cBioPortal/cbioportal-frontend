
var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

var assert = require('assert');
var expect = require('chai').expect;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('./specUtils').waitForNetworkQuiet;

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

        it('should show the exon number after adding the exon column', ()=>{
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
            assert.equal(textValuesWith6.length, 3);
        });

        it('should show more exon number after clicking "Show more"', ()=>{
            // click "show more" to add more data
            browser.click("button*=Show more");
            // check if 6 exact matches for 6 appear
            browser.waitUntil(() => {
                textValuesWith6 = browser.getText('//*[text()="6"]');
                return textValuesWith6.length === 6;
            }, 20000, "Exon data not in Exon column after clikcing show more button");
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
            }, 20000, "HGVSc values not in hgvs column");
        });

        it('should show more HGVSc data after clicking "Show more"', ()=>{
            // click "show more" to add more data
            browser.click("button*=Show more");
            // check if "C>T" exact matches for 12 appear
            browser.waitUntil(() => {
                var hgvscValues = browser.getText('//*[text()[contains(.,"C>T")]]');
                return hgvscValues.length > 0;
            }, 20000, "HGVSc values not in hgvs column after clicking show more button");
        });
    });

});
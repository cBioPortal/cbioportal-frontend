
var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

var assert = require('assert');
var expect = require('chai').expect;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('./specUtils').waitForNetworkQuiet;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

function waitForGenomeNexusAnnotation() {
    browser.pause(5000);// wait for annotation
}

describe('Mutation Mapper Tool', function() {
    before(function(){
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);
    });

    describe('example genomic changes input', ()=>{
        beforeEach(()=>{
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
            browser.scroll(0, 1000);
            // click "exon"
            browser.click('//*[text()="Exon"]');
            waitForNetworkQuiet();
            // check if 3 exact matches for 6 appear
            textValuesWith6 = browser.getText('//*[text()="6"]');
            assert.ok(textValuesWith6.length === 4);
        });

        it('should show more exon number after clicking "Show more"', ()=>{
            // check if 6 appears once in COSMIC column
            browser.waitForText('//*[text()="6"]',30000);
            var textValuesWith6 = browser.getText('//*[text()="6"]');
            assert.ok(textValuesWith6.length === 1);
            // click on column button
            browser.click("button*=Columns");
            // scroll down to activated "exon" selection
            browser.scroll(0, 1000);
            // click "exon"
            browser.click('//*[text()="Exon"]');
            waitForNetworkQuiet();
            // click "show more" to add more data
            browser.click("button*=Show more");
            waitForNetworkQuiet();
            // check if 6 exact matches for 6 appear
            textValuesWith6 = browser.getText('//*[text()="6"]');
            assert.ok(textValuesWith6.length === 6);
        });

        it('should show the HGVSc data after adding the HGVSc column', ()=>{           
            // click on column button
            browser.click("button*=Columns");
            // scroll down to activated "HGVSc" selection
            browser.scroll(0, 1000);
            // click "HGVSc"
            browser.waitForText('//*[text()="HGVSc"]',30000);
            browser.click('//*[text()="HGVSc"]');
            waitForNetworkQuiet();
            // check if "ENST00000269305.4:c.817C>T" appears
            var hgvscValues = browser.getText('//*[text()[contains(.,"ENST00000269305.4:c.817C>T")]]');
            assert.ok(hgvscValues.length > 0);
        });

        it('should show more HGVSc data after clicking "Show more"', ()=>{           
            // click on column button
            browser.click("button*=Columns");
            // scroll down to activated "HGVSc" selection
            browser.scroll(0, 1000);
            // click "HGVSc"
            browser.waitForText('//*[text()="HGVSc"]',30000);
            browser.click('//*[text()="HGVSc"]');
            waitForNetworkQuiet();
            // click "show more" to add more data
            browser.click("button*=Show more");
            waitForNetworkQuiet();
            // check if "C>T" exact matches for 12 appear
            var hgvscValues = browser.getText('//*[text()[contains(.,"C>T")]]');
            assert.ok(hgvscValues.length === 12);
        });
    });

});
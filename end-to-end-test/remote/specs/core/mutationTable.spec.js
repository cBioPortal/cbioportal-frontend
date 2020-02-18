var executeInBrowser = require('../../../shared/specUtils').executeInBrowser;

var assert = require('assert');
var expect = require('chai').expect;
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils').goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('../../../shared/specUtils').waitForNetworkQuiet;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

function waitForGenomeNexusAnnotation() {
    browser.pause(5000); // wait for annotation
}

describe('Mutation Table', function() {
    before(function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);
    });

    describe('try getting exon and hgvsc info from genome nexus', () => {
        before(() => {
            var url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&Z_SCORE_THRESHOLD=1.0&cancer_study_id=gbm_tcga_pub&cancer_study_list=gbm_tcga_pub&case_set_id=gbm_tcga_pub_sequenced&clinicallist=PROFILED_IN_gbm_tcga_pub_cna_rae&gene_list=TP53%20MDM2%20MDM4&gene_set_choice=user-defined_list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_pub_cna_rae&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_pub_mutations&show_samples=false`;

            goToUrlAndSetLocalStorage(url);
            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            browser.waitForVisible('tr:nth-child(1) [data-test=oncogenic-icon-image]', 30000);
        });

        it('should show the exon number after adding the exon column', () => {
            // check if 6 appears once in COSMIC column

            // click on column button
            browser.click('button*=Columns');
            // scroll down to activated "exon" selection
            browser.scroll(1000, 1000);
            // click "exon"
            browser.click('//*[text()="Exon"]');
            // check if three exact matches for 6 appear

            let res;
            browser.waitUntil(
                () => {
                    res = executeInBrowser(() => $('[class*=exon-module__exon-table]').length);
                    return res == 25;
                },
                60000,
                `Failed: There's 25 exons rows in table (${res} found)`
            );
        });

        it('should show more exon number after clicking "Show more"', () => {
            // click "show more" to add more data
            browser.click('button*=Show more');
            let res;
            browser.waitUntil(
                () => {
                    res = executeInBrowser(() => $('[class*=exon-module__exon-table]').length);
                    return res > 25;
                },
                60000,
                `Failed: There's more than 25 exons rows in table (${res} found)`
            );
        });

        it('should show the HGVSc data after adding the HGVSc column', () => {
            // reopen columns
            browser.click('button*=Columns');
            // click "HGVSc"
            browser.click('//*[text()="HGVSc"]');

            browser.waitForExist('//*[text()[contains(.,"ENST00000269305.4:c.817C>T")]]', 60000);
        });

        it('should show more HGVSc data after clicking "Show more"', () => {
            // click "show more" to add more data
            browser.click('button*=Show more');
            // check if "C>T" exact matches for 12 appear
            browser.waitForExist('//*[text()[contains(.,"C>T")]]', 60000);
        });
    });

    describe('try getting GNOMAD from genome nexus', () => {
        before(() => {
            var url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016&case_set_id=nsclc_tcga_broad_2016_cnaseq&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations&tab_index=tab_visualize`;

            goToUrlAndSetLocalStorage(url);
            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            browser.waitForVisible('tr:nth-child(1) [data-test=oncogenic-icon-image]', 300000);
        });

        it('should show the gnomad table after mouse over the frequency in gnomad column', () => {
            // filter the table
            var textArea = browser.$('[class*=tableSearchInput]');
            // only show LUAD-B00416-Tumor in table
            textArea.setValue('LUAD-B00416-Tumor');
            browser.waitForVisible('tr:nth-child(1) [data-test=oncogenic-icon-image]', 60000);
            // show the gnomad column
            browser.scroll(1000, 0);
            // click on column button
            browser.click('button*=Columns');
            // scroll down to activated "GNOMAD" selection
            browser.scroll(1000, 1000);
            // wait for gnomad checkbox appear
            browser.waitForVisible('[data-id=gnomAD]', 60000);
            // click "GNOMAD"
            browser.click('//*[text()="gnomAD"]');
            // find frequency
            const frequency = '[data-test2="LUAD-B00416-Tumor"][data-test="gnomad-column"]';
            browser.waitForExist(frequency, 60000);
            // wait for gnomad frequency show in the column
            browser.waitUntil(
                () => {
                    var textFrequency = browser.getText(frequency);
                    return textFrequency.length >= 1;
                },
                600000,
                'Frequency data not in Gnoamd column'
            );
            // mouse over the frequency
            browser.moveToObject(frequency, 0, 0);
            // wait for gnomad table showing up
            browser.waitForExist('[data-test="gnomad-table"]', 300000);
            // check if the gnomad table show up
            let res;
            browser.waitUntil(
                () => {
                    res = executeInBrowser(() => $('[data-test="allele-frequency-data"]').length);
                    return res == 9;
                },
                60000,
                `Failed: There's 9 allele frequency rows in table (${res} found)`
            );
        });
    });

    describe('try getting ClinVar id from genome nexus', () => {
        before(() => {
            var url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=brca_broad&case_set_id=brca_broad_sequenced&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_broad_mutations&tab_index=tab_visualize`;

            goToUrlAndSetLocalStorage(url);
            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            browser.waitForVisible('tr:nth-child(1) [data-test=oncogenic-icon-image]', 30000);
        });

        it('should show the ClinVar id after adding the ClinVar column', () => {
            // click on column button
            browser.click('button*=Columns');
            // scroll down to activated "ClinVar" selection
            browser.scroll(1000, 1000);
            // click "clinvar"
            browser.click('//*[text()="ClinVar ID"]');
            let res;
            browser.waitUntil(
                () => {
                    res = executeInBrowser(() => $('[data-test="clinvar-data"]').length);
                    return res == 25;
                },
                60000,
                `Failed: There's 25 clinvar rows in table (${res} found)`
            );
        });
    });

    describe('try getting dbSNP from genome nexus', () => {
        before(() => {
            var url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=brca_broad&case_set_id=brca_broad_sequenced&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_broad_mutations&tab_index=tab_visualize`;

            goToUrlAndSetLocalStorage(url);
            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            browser.waitForVisible('tr:nth-child(1) [data-test=oncogenic-icon-image]', 30000);
        });

        it('should show the rs ids in dbsnp after adding the dbSNP column', () => {
            // click on column button
            browser.click('button*=Columns');
            // scroll down to activated "dbSNP" selection
            browser.scroll(1000, 1000);
            // click "dbSNP"
            browser.click('//*[text()="dbSNP"]');
            let res;
            browser.waitUntil(
                () => {
                    res = executeInBrowser(() => $('[data-test="dbsnp-data"]').length);
                    return res == 25;
                },
                60000,
                `Failed: There's 25 dbsnp rows in table (${res} found)`
            );
        });
    });
});

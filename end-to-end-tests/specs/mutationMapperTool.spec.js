
var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

var assert = require('assert');
var expect = require('chai').expect;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;

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
            var url = `${CBIOPORTAL_URL}/mutation_mapper`;
            goToUrlAndSetLocalStorage(url);
            browser.waitForVisible('[data-test=GenomicChangesExampleButton]',10000)
        });

        it('should correctly annotate the genomic changes example and display the results', ()=>{
            browser.click('[data-test=GenomicChangesExampleButton]');
            browser.click('[data-test=MutationMapperToolVisualizeButton]');

            waitForGenomeNexusAnnotation();

            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            browser.waitForVisible("tr:nth-child(1) [data-test=oncogenic-icon-image]",20000);

            const mutationsT790M = browser.getText('.//*[text()[contains(.,"T790M")]]')
            assert.equal(mutationsT790M.length, 2, "there should be two samples with a T790M mutation");

            // check total number of mutations (this gets Showing 1-25 of 122
            // Mutations)
            let mutationCount = browser.getText('.//*[text()[contains(.,"122 Mutations")]]')
            assert.ok(mutationCount.length > 0);

            const brca1 = browser.getText('.//*[text()[contains(.,"BRCA1")]]')
            assert.ok(brca1.length > 0);
            browser.elements(".nav-pill").click("a*=BRCA1")

            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            browser.waitForVisible("[data-test=oncogenic-icon-image]",20000);

            // check total number of mutations (this gets Showing 1-25 of 85
            // Mutations)
            mutationCount = browser.getText('.//*[text()[contains(.,"85 Mutations")]]')
            assert.ok(mutationCount.length > 0);

            const brca2 = browser.getText('.//*[text()[contains(.,"BRCA2")]]')
            assert.ok(brca2.length > 0);
            browser.elements(".nav-pill").click("a*=BRCA2")
            // check total number of mutations (this gets Showing 1-25 of 113
            // Mutations)
            browser.waitForText('.//*[text()[contains(.,"113 Mutations")]]')

            const pten = browser.getText('.//*[text()[contains(.,"PTEN")]]')
            assert.ok(pten.length > 0);
            browser.elements(".nav-pill").click("a*=PTEN")
            // check total number of mutations (this gets Showing 1-25 of 136
            // Mutations)
            browser.waitForText('.//*[text()[contains(.,"136 Mutations")]]')
        });

        it('should update the listed number of mutations when selecting a different transcript in the dropdown', ()=>{
            browser.click('[data-test=GenomicChangesExampleButton]');
            browser.click('[data-test=MutationMapperToolVisualizeButton]');

            waitForGenomeNexusAnnotation();

            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            browser.waitForVisible("[data-test=oncogenic-icon-image]",20000);

            // wait for transcript to be listed
            browser.waitForText('.//*[text()[contains(.,"NM_005228")]]');
            // click on dropbox
            browser.elements('.//*[text()[contains(.,"NM_005228")]]').value[0].click();
            // select a different transcript
            browser.elements('.//*[text()[contains(.,"NM_201283")]]').value[0].click();

            // check number of mutations on this transcript (this gets Showing
            // 1-23 of 23 Mutations)
            browser.waitForText('.//*[text()[contains(.,"23 Mutations")]]');
        });

        it('should show all transcripts when using protein changes', ()=>{
            browser.click('[data-test=ProteinChangesExampleButton]');
            browser.click('[data-test=MutationMapperToolVisualizeButton]');

            waitForGenomeNexusAnnotation();

            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            browser.waitForVisible("[data-test=oncogenic-icon-image]",20000);
            // it should have 124 egfr mutations
            browser.waitForText('.//*[text()[contains(.,"124 Mutations")]]');

            // wait for transcript to be listed
            browser.waitForText('.//*[text()[contains(.,"NM_005228")]]');
            // click on dropbox
            browser.elements('.//*[text()[contains(.,"NM_005228")]]').value[0].click();


            // check if all 8 transcripts are listed (already know the one above
            // is listed, since we clicked on it)
            browser.waitForText('.//*[text()[contains(.,"NM_201284")]]');
            browser.waitForText('.//*[text()[contains(.,"NM_201282")]]');
            browser.waitForText('.//*[text()[contains(.,"NM_201283")]]');
            browser.waitForText('.//*[text()[contains(.,"ENST00000454757")]]');
            browser.waitForText('.//*[text()[contains(.,"ENST00000455089")]]');
            browser.waitForText('.//*[text()[contains(.,"ENST00000442591")]]');
            browser.waitForText('.//*[text()[contains(.,"ENST00000450046")]]');

            // select a different transcript
            browser.elements('.//*[text()[contains(.,"NM_201283")]]').value[0].click();

            // check number of mutations on this transcript (this should keep
            // showing all mutations (we don't know which transcript was used to
            // get those annotations the user inputted))
            browser.waitForText('.//*[text()[contains(.,"124 Mutations")]]');
        });

        it('should show all transcripts when using combination of genomic and protein changes', ()=>{
            browser.click('[data-test=GenomicAndProteinChangesExampleButton]');
            browser.click('[data-test=MutationMapperToolVisualizeButton]');

            waitForGenomeNexusAnnotation();

            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            browser.waitForVisible("[data-test=oncogenic-icon-image]",20000);
            // it should have 122 egfr mutations
            browser.waitForText('.//*[text()[contains(.,"122 Mutations")]]');

            // wait for transcript to be listed
            browser.waitForText('.//*[text()[contains(.,"NM_005228")]]');
            // click on dropbox
            browser.elements('.//*[text()[contains(.,"NM_005228")]]').value[0].click();


            // check if all 8 transcripts are listed (already know the one above
            // is listed, since we clicked on it)
            browser.waitForText('.//*[text()[contains(.,"NM_201284")]]');
            browser.waitForText('.//*[text()[contains(.,"NM_201282")]]');
            browser.waitForText('.//*[text()[contains(.,"NM_201283")]]');
            browser.waitForText('.//*[text()[contains(.,"ENST00000454757")]]');
            browser.waitForText('.//*[text()[contains(.,"ENST00000455089")]]');
            browser.waitForText('.//*[text()[contains(.,"ENST00000442591")]]');
            browser.waitForText('.//*[text()[contains(.,"ENST00000450046")]]');

            // select a different transcript
            browser.elements('.//*[text()[contains(.,"NM_201283")]]').value[0].click();

            // check number of mutations on this transcript (this should keep
            // showing all mutations (we don't know which transcript was used to
            // get those annotations the user inputted))
            browser.waitForText('.//*[text()[contains(.,"122 Mutations")]]');
        });

        it('should correctly annotate the protein changes example and display the results', ()=>{
            browser.click('[data-test=ProteinChangesExampleButton]');
            browser.click('[data-test=MutationMapperToolVisualizeButton]');

            waitForGenomeNexusAnnotation();

            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            browser.waitForVisible("tr:nth-child(1) [data-test=oncogenic-icon-image]",20000);

            const mutationsT790M = browser.getText('.//*[text()[contains(.,"T790M")]]')
            assert.equal(mutationsT790M.length, 2, "there should be two samples with a T790M mutation");

            // check total number of mutations (this gets Showing 1-25 of 124
            // Mutations)
            const mutationCount = browser.getText('.//*[text()[contains(.,"124 Mutations")]]')
            assert.ok(mutationCount.length > 0);

            const brca1 = browser.getText('.//*[text()[contains(.,"BRCA1")]]')
            assert.ok(brca1.length > 0);

            const brca2 = browser.getText('.//*[text()[contains(.,"BRCA2")]]')
            assert.ok(brca2.length > 0);

            const pten = browser.getText('.//*[text()[contains(.,"PTEN")]]')
            assert.ok(pten.length > 0);
        });

        it('should not display mutations that do not affect the displayed transcript id (HIST1H2BN, ENST00000396980)', ()=>{
            var input = $("#standaloneMutationTextInput");
            input.setValue(
                "Sample_ID Cancer_Type Chromosome Start_Position End_Position Reference_Allele Variant_Allele\nTCGA-49-4494-01 Lung_Adenocarcinoma 6 27819890 27819890 A G"
            );

            browser.click('[data-test=MutationMapperToolVisualizeButton]');

            browser.waitForVisible("[class=borderedChart]",20000);

            // the canonical transcript id for HIST1H2BN is ENST00000396980, but
            // this mutation only applies to ENST00000606613
            browser.waitForText('.//*[text()[contains(.,"ENST00000606613")]]')

            browser.waitForText('.//*[text()[contains(.,"1 Mutation")]]');

        });

        it('should show a warning when certain lines were not annotated', ()=>{
            var input = $("#standaloneMutationTextInput");
            input.setValue(
                "Sample_ID Cancer_Type Chromosome Start_Position End_Position Reference_Allele Variant_Allele\nTCGA-O2-A52N-01 Lung_Squamous_Cell_Carcinoma 7 -1 -1 NA\nTCGA-33-4566-01 Lung_Squamous_Cell_Carcinoma 7 55269425 55269425 C T"
            );

            browser.click('[data-test=MutationMapperToolVisualizeButton]');

            browser.waitForVisible("[class=borderedChart]",20000);

            const warning = browser.getText('.//*[text()[contains(.,"Failed to annotate")]]')
            assert.ok(warning.length > 0, "there should be a warning indicating one mutation failed annotation");

            browser.click('[data-test=ShowWarningsButton]');

            const failingRecord = browser.getText('.//*[text()[contains(.,"TCGA-33-4566-01")]]');
            assert.ok(failingRecord.length > 0, "there should be a warning indicating which sample is failing");
        });

        // based on HLA-A user question
        // https://groups.google.com/forum/?utm_medium=email&utm_source=footer#!msg/cbioportal/UQP41OIT5HI/1AaX24AcAwAJ
        it('should not show the canonical transcript when there are no matching annotations', ()=>{
            var input = $("#standaloneMutationTextInput");
            const hla = require("./data/hla_a_test_mutation_mapper_tool.txt");

            input.setValue(hla);
            browser.click('[data-test=MutationMapperToolVisualizeButton]');

            browser.waitForVisible("[class=borderedChart]",20000);

            // check total number of mutations (this gets Showing 1-12 of 12
            // Mutations)
            const mutationCount = browser.getText('.//*[text()[contains(.,"12 Mutations")]]')
            assert.ok(mutationCount.length > 0);
        });
    });

});
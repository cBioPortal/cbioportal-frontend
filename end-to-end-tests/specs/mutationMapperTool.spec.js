
var assertScreenShotMatch = require('../lib/testUtils').assertScreenShotMatch;

var assert = require('assert');
var expect = require('chai').expect;
var goToUrlAndSetLocalStorage = require('./specUtils').goToUrlAndSetLocalStorage;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe('Mutation Mapper Tool', function() {
    before(function(){
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);
    });

    describe('example genomic changes input', ()=>{
        beforeEach(()=>{
            var url = `${CBIOPORTAL_URL}/mutation_mapper.jsp`;
            goToUrlAndSetLocalStorage(url);
            browser.waitForVisible('[data-test=GenomicChangesExampleButton]',10000)
        });

        it('should correctly annotate the genomic changes example and display the results', ()=>{
            browser.click('[data-test=GenomicChangesExampleButton]');
            browser.click('[data-test=MutationMapperToolVisualizeButton]');

            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            browser.waitForVisible("[data-test=oncogenic-icon-image]",20000);

            const mutationsT790M = browser.getText('.//*[text()[contains(.,"T790M")]]')
            assert.equal(mutationsT790M.length, 2, "there should be two samples with a T790M mutation");

            // check total number of mutations (this gets Showing 1-25 of 122
            // Mutations)
            let mutationCount = browser.getText('.//*[text()[contains(.,"122 Mutations")]]')
            assert.ok(mutationCount.length > 0);

            const brca1 = browser.getText('.//*[text()[contains(.,"BRCA1")]]')
            assert.ok(brca1.length > 0);
            browser.elements(".nav-pill").click("a*=BRCA1")
            // check total number of mutations (this gets Showing 1-25 of 85
            // Mutations)
            mutationCount = browser.getText('.//*[text()[contains(.,"85 Mutations")]]')
            assert.ok(mutationCount.length > 0);

            const brca2 = browser.getText('.//*[text()[contains(.,"BRCA2")]]')
            assert.ok(brca2.length > 0);
            browser.elements(".nav-pill").click("a*=BRCA2")
            // check total number of mutations (this gets Showing 1-25 of 113
            // Mutations)
            mutationCount = browser.getText('.//*[text()[contains(.,"113 Mutations")]]')
            assert.ok(mutationCount.length > 0);

            const pten = browser.getText('.//*[text()[contains(.,"PTEN")]]')
            assert.ok(pten.length > 0);
            browser.elements(".nav-pill").click("a*=PTEN")
            // check total number of mutations (this gets Showing 1-25 of 136
            // Mutations)
            mutationCount = browser.getText('.//*[text()[contains(.,"136 Mutations")]]')
            assert.ok(mutationCount.length > 0);
        });

        it('should correctly annotate the protein changes example and display the results', ()=>{
            browser.click('[data-test=ProteinChangesExampleButton]');
            browser.click('[data-test=MutationMapperToolVisualizeButton]');

            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            browser.waitForVisible("[data-test=oncogenic-icon-image]",20000);

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

            const transcriptId = browser.getText('.//*[text()[contains(.,"ENST00000396980")]]')
            assert.ok(transcriptId.length > 0, "the canonical transcript id for HIST1H2BN should be ENST00000396980");


            const mutationCount = browser.getText('.//*[text()[contains(.,"There are no results")]]');
            assert.ok(mutationCount.length > 0, "there shouldn't be any mutations visible");

        });
    });

});
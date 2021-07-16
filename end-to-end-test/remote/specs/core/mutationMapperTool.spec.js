var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;

var fs = require('fs');

var assert = require('assert');
var expect = require('chai').expect;
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

var exampleMaf = require('./data/hla_a_test_mutation_mapper_tool');

function waitForGenomeNexusAnnotation() {
    browser.pause(5000); // wait for annotation
}

describe('Mutation Mapper Tool', function() {
    before(function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);
    });

    describe('example genomic changes input', () => {
        beforeEach(() => {
            var url = `${CBIOPORTAL_URL}/mutation_mapper`;
            goToUrlAndSetLocalStorage(url);
            $('[data-test=GenomicChangesExampleButton]').waitForDisplayed({
                timeout: 10000,
            });
        });

        it('should correctly annotate the genomic changes example and display the results', () => {
            $('[data-test=GenomicChangesExampleButton]').click();
            $('[data-test=MutationMapperToolVisualizeButton]').click();

            waitForGenomeNexusAnnotation();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            $(
                'tr:nth-child(1) [data-test=oncogenic-icon-image]'
            ).waitForDisplayed({ timeout: 60000 });

            // Waiting for Annotation column sorting
            $('.//*[text()[contains(.,"T790M")]]').waitForExist();

            assert.equal(
                $$('.//*[text()[contains(.,"T790M")]]').length,
                2,
                'there should be two samples with a T790M mutation'
            );

            // check total number of mutations (this gets Showing 1-25 of 122
            // Mutations)
            assert.ok(
                $('.//*[text()[contains(.,"122 Mutations")]]').isExisting()
            );

            assert.ok($('.//*[text()[contains(.,"BRCA1")]]').isExisting());
            $('.nav-pills')
                .$('a*=BRCA1')
                .click();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            $('[data-test=oncogenic-icon-image]').waitForDisplayed({
                timeout: 60000,
            });

            // check total number of mutations (this gets Showing 1-25 of 85
            // Mutations)
            assert.ok(
                $('.//*[text()[contains(.,"85 Mutations")]]').isExisting()
            );

            assert.ok($('.//*[text()[contains(.,"BRCA2")]]').isExisting());
            $('.nav-pills')
                .$('a*=BRCA2')
                .click();
            // check total number of mutations (this gets Showing 1-25 of 113
            // Mutations)
            $('.//*[text()[contains(.,"113 Mutations")]]').waitForExist();

            assert.ok($('.//*[text()[contains(.,"PTEN")]]').isExisting());
            $('.nav-pills')
                .$('a*=PTEN')
                .click();
            // check total number of mutations (this gets Showing 1-25 of 136
            // Mutations)
            $('.//*[text()[contains(.,"136 Mutations")]]').waitForExist();
        });

        it('should update the listed number of mutations when selecting a different transcript in the dropdown', () => {
            $('[data-test=GenomicChangesExampleButton]').click();
            $('[data-test=MutationMapperToolVisualizeButton]').click();

            waitForGenomeNexusAnnotation();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            $('[data-test=oncogenic-icon-image]').waitForDisplayed({
                timeout: 60000,
            });

            // wait for transcript to be listed
            $('.//*[text()[contains(.,"NM_005228")]]').waitForExist();
            // click on dropbox
            $('.//*[text()[contains(.,"NM_005228")]]').click();
            // select a different transcript
            $('.//*[text()[contains(.,"NM_201283")]]').click();

            // check number of mutations on this transcript (this gets Showing
            // 1-27 of 27 Mutations)
            $('.//*[text()[contains(.,"27 Mutations")]]').waitForExist();
        });

        it('should show all transcripts when using protein changes', () => {
            $('[data-test=ProteinChangesExampleButton]').click();
            $('[data-test=MutationMapperToolVisualizeButton]').click();

            waitForGenomeNexusAnnotation();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            $('[data-test=oncogenic-icon-image]').waitForDisplayed({
                timeout: 60000,
            });
            // it should have 124 egfr mutations
            $('.//*[text()[contains(.,"124 Mutations")]]').waitForExist();

            // wait for transcript to be listed
            $('.//*[text()[contains(.,"NM_005228")]]').waitForExist();
            // click on dropbox
            $('.//*[text()[contains(.,"NM_005228")]]').click();

            // check if all 8 transcripts are listed (already know the one above
            // is listed, since we clicked on it)
            $('.//*[text()[contains(.,"NM_201284")]]').waitForExist();
            $('.//*[text()[contains(.,"NM_201282")]]').waitForExist();
            $('.//*[text()[contains(.,"NM_201283")]]').waitForExist();
            $('.//*[text()[contains(.,"ENST00000454757")]]').waitForExist();
            $('.//*[text()[contains(.,"ENST00000455089")]]').waitForExist();
            $('.//*[text()[contains(.,"ENST00000442591")]]').waitForExist();
            $('.//*[text()[contains(.,"ENST00000450046")]]').waitForExist();

            // select a different transcript
            $('.//*[text()[contains(.,"NM_201283")]]').click();

            // check number of mutations on this transcript (this should keep
            // showing all mutations (we don't know which transcript was used to
            // get those annotations the user inputted))
            $('.//*[text()[contains(.,"124 Mutations")]]').waitForExist();
        });

        it('should show all transcripts when using combination of genomic and protein changes', () => {
            $('[data-test=GenomicAndProteinChangesExampleButton]').click();
            $('[data-test=MutationMapperToolVisualizeButton]').click();

            waitForGenomeNexusAnnotation();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            $('[data-test=oncogenic-icon-image]').waitForDisplayed({
                timeout: 60000,
            });
            // it should have 122 egfr mutations
            $('.//*[text()[contains(.,"122 Mutations")]]').waitForExist();

            // wait for transcript to be listed
            $('.//*[text()[contains(.,"NM_005228")]]').waitForExist();
            // click on dropbox
            $('.//*[text()[contains(.,"NM_005228")]]').click();

            // check if all 8 transcripts are listed (already know the one above
            // is listed, since we clicked on it)
            $('.//*[text()[contains(.,"NM_201284")]]').waitForExist();
            $('.//*[text()[contains(.,"NM_201282")]]').waitForExist();
            $('.//*[text()[contains(.,"NM_201283")]]').waitForExist();
            $('.//*[text()[contains(.,"ENST00000454757")]]').waitForExist();
            $('.//*[text()[contains(.,"ENST00000455089")]]').waitForExist();
            $('.//*[text()[contains(.,"ENST00000442591")]]').waitForExist();
            $('.//*[text()[contains(.,"ENST00000450046")]]').waitForExist();

            // select a different transcript
            $('.//*[text()[contains(.,"NM_201283")]]').click();

            // check number of mutations on this transcript (this should keep
            // showing all mutations (we don't know which transcript was used to
            // get those annotations the user inputted))
            $('.//*[text()[contains(.,"122 Mutations")]]').waitForExist();
        });

        it('should correctly annotate the protein changes example and display the results', () => {
            $('[data-test=ProteinChangesExampleButton]').click();
            $('[data-test=MutationMapperToolVisualizeButton]').click();

            waitForGenomeNexusAnnotation();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            $(
                'tr:nth-child(1) [data-test=oncogenic-icon-image]'
            ).waitForDisplayed({ timeout: 60000 });

            const mutationsT790M = $$('.//*[text()[contains(.,"T790M")]]');
            assert.equal(
                mutationsT790M.length,
                2,
                'there should be two samples with a T790M mutation'
            );

            // check total number of mutations (this gets Showing 1-25 of 124
            // Mutations)
            assert.ok(
                $('.//*[text()[contains(.,"124 Mutations")]]').isExisting()
            );

            assert.ok($('.//*[text()[contains(.,"BRCA1")]]').isExisting());

            assert.ok($('.//*[text()[contains(.,"BRCA2")]]').isExisting());

            assert.ok($('.//*[text()[contains(.,"PTEN")]]').isExisting());
        });

        it.skip('should not display mutations that do not affect the displayed transcript id (HIST1H2BN, ENST00000396980)', () => {
            var input = $('#standaloneMutationTextInput');
            input.setValue(
                'Sample_ID Cancer_Type Chromosome Start_Position End_Position Reference_Allele Variant_Allele\nTCGA-49-4494-01 Lung_Adenocarcinoma 6 27819890 27819890 A G'
            );

            $('[data-test=MutationMapperToolVisualizeButton]').click();

            $('[class=borderedChart]').waitForDisplayed({ timeout: 20000 });

            // the canonical transcript id for HIST1H2BN is ENST00000396980, but
            // this mutation applies to ENST00000606613 and ENST00000449538
            $('.//*[text()[contains(.,"ENST00000449538")]]').waitForExist();

            $('.//*[text()[contains(.,"1 Mutation")]]').waitForExist();
        });

        it('should show a warning when certain lines were not annotated', () => {
            var input = $('#standaloneMutationTextInput');
            input.setValue(
                'Sample_ID Cancer_Type Chromosome Start_Position End_Position Reference_Allele Variant_Allele\nTCGA-O2-A52N-01 Lung_Squamous_Cell_Carcinoma 7 -1 -1 NA\nTCGA-33-4566-01 Lung_Squamous_Cell_Carcinoma 7 55269425 55269425 C T'
            );

            $('[data-test=MutationMapperToolVisualizeButton]').click();

            $('[class=borderedChart]').waitForDisplayed({ timeout: 20000 });

            assert.ok(
                $(
                    './/*[text()[contains(.,"Failed to annotate")]]'
                ).isExisting(),
                'there should be a warning indicating one mutation failed annotation'
            );

            $('[data-test=ShowWarningsButton]').click();

            assert.ok(
                $('.//*[text()[contains(.,"TCGA-33-4566-01")]]').isExisting(),
                'there should be a warning indicating which sample is failing'
            );
        });

        // based on HLA-A user question
        // https://groups.google.com/forum/?utm_medium=email&utm_source=footer#!msg/cbioportal/UQP41OIT5HI/1AaX24AcAwAJ
        it.skip('should not show the canonical transcript when there are no matching annotations', () => {
            const input = $('#standaloneMutationTextInput');
            const hla = require('./data/hla_a_test_mutation_mapper_tool.txt');

            input.setValue(hla);
            $('[data-test=MutationMapperToolVisualizeButton]').click();

            $('[class=borderedChart]').waitForDisplayed({ timeout: 20000 });

            // the canonical transcript id for HLA-A is ENST00000376809, but
            // these mutations apply to ENST00000376802
            $('.//*[text()[contains(.,"ENST00000376802")]]').waitForExist();

            // check total number of mutations (all should be successfully annotated)
            const mutationCount = $(
                './/*[text()[contains(.,"16 Mutations")]]'
            ).getText();

            assert.ok(mutationCount.length > 0);
        });
    });

    describe('GRCh38 example genomic changes input', () => {
        beforeEach(() => {
            var url = `${CBIOPORTAL_URL}/mutation_mapper`;
            goToUrlAndSetLocalStorage(url);
            $('[data-test=MutationMapperToolGRCh38Button]').waitForDisplayed({
                timeout: 10000,
            });
        });

        it('should correctly annotate the genomic changes example with GRCh38 and display the results', () => {
            // choose GRCh38
            $('[data-test=MutationMapperToolGRCh38Button]').click();
            // the page will reloda after change genome build, wait until loading finished
            $('[data-test=GenomicChangesExampleButton]').waitForDisplayed({
                timeout: 10000,
            });
            $('[data-test=GenomicChangesExampleButton]').click();
            $('[data-test=MutationMapperToolVisualizeButton]').click();

            waitForGenomeNexusAnnotation();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            $(
                'tr:nth-child(1) [data-test=oncogenic-icon-image]'
            ).waitForDisplayed({ timeout: 60000 });

            // Waiting for Annotation column sorting
            $('.//*[text()[contains(.,"T790M")]]').waitForExist();

            assert.equal(
                $$('.//*[text()[contains(.,"T790M")]]').length,
                2,
                'there should be two samples with a T790M mutation'
            );

            // check total number of mutations (this gets Showing 1-25 of 122
            // Mutations)
            assert.ok(
                $('.//*[text()[contains(.,"122 Mutations")]]').isExisting()
            );

            const brca1 = $('.//*[text()[contains(.,"BRCA1")]]');
            assert.ok(brca1.isExisting());
            $('.nav-pills')
                .$('a*=BRCA1')
                .click();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            $('[data-test=oncogenic-icon-image]').waitForDisplayed({
                timeout: 60000,
            });

            // check total number of mutations (this gets Showing 1-25 of 85
            // Mutations)
            mutationCount = $('.//*[text()[contains(.,"85 Mutations")]]');
            assert.ok(mutationCount.isExisting());

            const brca2 = $('.//*[text()[contains(.,"BRCA2")]]');
            assert.ok(brca2.isExisting());
            $('.nav-pills')
                .$('a*=BRCA2')
                .click();
            // check total number of mutations (this gets Showing 1-25 of 113
            // Mutations)
            $('.//*[text()[contains(.,"113 Mutations")]]').waitForExist();

            const pten = $('.//*[text()[contains(.,"PTEN")]]');
            assert.ok(pten.isExisting());
            $('.nav-pills')
                .$('a*=PTEN')
                .click();
            // check total number of mutations (this gets Showing 1-25 of 136
            // Mutations)
            $('.//*[text()[contains(.,"136 Mutations")]]').waitForExist();
        });

        it('should show dbSNP with GRCh38 instance', () => {
            // dbSNP is getting from myVariant Info
            // choose GRCh38
            $('[data-test=MutationMapperToolGRCh38Button]').click();
            // the page will reloda after change genome build, wait until loading finished
            $('[data-test=GenomicChangesExampleButton]').waitForDisplayed({
                timeout: 10000,
            });
            $('[data-test=GenomicChangesExampleButton]').click();
            $('[data-test=MutationMapperToolVisualizeButton]').click();

            waitForGenomeNexusAnnotation();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            $('[data-test=oncogenic-icon-image]').waitForDisplayed({
                timeout: 60000,
            });

            // click on column button
            $('button*=Columns').click();
            // scroll down to activated "dbSNP" selection
            $('//*[text()="dbSNP"]').scrollIntoView();
            // click "dbSNP"
            $('//*[text()="dbSNP"]').click();
            $('.//*[text()[contains(.,"rs121434568")]]').waitForExist();
        });
    });
});

var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var useExternalFrontend = require('../../../shared/specUtils')
    .useExternalFrontend;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var selectReactSelectOption = require('../../../shared/specUtils')
    .selectReactSelectOption;
var waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const resultsViewComparisonTab = `${CBIOPORTAL_URL}/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=BRCA1%2520BRCA2&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize&comparison_subtab=alterations`;

if (useExternalFrontend) {
    describe('comparison alterations tab', function() {
        beforeEach(() => {
            loadAlterationsTab();
        });

        it('shows basic counts', function() {
            var alteredCount = selectAlteredCount('ABLIM1');
            assert.strictEqual(selectAlteredCount('ABLIM1'), '1 (8.33%)');
        });

        it('shows banner when no results retrieved', function() {
            clickAlterationTypeCheckBox('Mutations');
            clickAlterationTypeCheckBox('Structural Variants / Fusions');
            clickAlterationTypeCheckBox('Copy Number Alterations');
            $('[data-test=buttonSelectAlterations]').click();
            $('div=No data/result available').waitForExist();
            assert($('div=No data/result available').isVisible());
        });

        it('filters mutation types', function() {
            clickAlterationTypeCheckBox('Copy Number Alterations');
            clickAlterationTypeCheckBox('Structural Variants / Fusions');
            submitEnrichmentRequest();
            $('[data-test=LazyMobXTable]').waitForVisible();
            var rows = $$('[data-test=LazyMobXTable] tbody tr');
            assert.strictEqual(rows.length, 8, 'table has 8 rows');
            clickAlterationTypeCheckBox('Mutations');
            clickAlterationTypeCheckBox('Frameshift Deletion');
            submitEnrichmentRequest();
            $('[data-test=LazyMobXTable]').waitForVisible();
            rows = $$('[data-test=LazyMobXTable] tbody tr');
            assert.strictEqual(rows.length, 2, 'table has 2 rows');
        });

        it('filters CNA types', function() {
            clickAlterationTypeCheckBox('Mutations');
            submitEnrichmentRequest();
            $('[data-test=LazyMobXTable]').waitForVisible();
            assert.strictEqual(selectUnalteredCount('ACAP3'), '9 (1.16%)');
            clickAlterationTypeCheckBox('Deletion');
            submitEnrichmentRequest();
            $('[data-test=LazyMobXTable]').waitForVisible();
            assert.strictEqual(selectUnalteredCount('ACAP3'), '7 (0.90%)');
        });
    });
}

// The loading of the tabs in comparison view is extremely fragile.
// Multiple loading attempts are needed in some cases to show the
// enrichment panels and make the tests pass reliably.
var loadAlterationsTab = () => {
    var timeIntervals = [3000, 4000, 5000, 5000, 10000];
    for (const timeInterval of timeIntervals) {
        goToUrlAndSetLocalStorage(resultsViewComparisonTab, true);
        browser.pause(timeInterval);
        if ($('[data-test=GroupComparisonAlterationEnrichments]').isVisible())
            break;
    }
};

var selectAlteredCount = genename => {
    var row = $(`span=${genename}`)
        .$('..')
        .$('..')
        .$('..');
    var alteredCount = row
        .$$('td')[2]
        .$('span')
        .getText();
    return alteredCount;
};

var selectUnalteredCount = genename => {
    var row = $(`span=${genename}`)
        .$('..')
        .$('..')
        .$('..');
    var alteredCount = row
        .$$('td')[3]
        .$('span')
        .getText();
    return alteredCount;
};

var clickAlterationTypeCheckBox = name => {
    $('label=' + name)
        .$('input')
        .click();
};

var submitEnrichmentRequest = () => {
    $('[data-test=buttonSelectAlterations]').click();
    $('[data-test=GroupComparisonAlterationEnrichments]').waitForExist(10000);
};

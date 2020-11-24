var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var useExternalFrontend = require('../../../shared/specUtils')
    .useExternalFrontend;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var selectReactSelectOption = require('../../../shared/specUtils')
    .selectReactSelectOption;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const resultsViewComparisonTab = `${CBIOPORTAL_URL}/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=BRCA1%2520BRCA2&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize&comparison_subtab=alterations`;

if (useExternalFrontend) {
    describe('comparison alterations tab', function() {
        beforeEach(() => {
            loadAltationsTab();
        });

        it('shows basic counts', function() {
            var alteredCount = selectAlteredCount('ABLIM1');
            assert.strictEqual(selectAlteredCount('ABLIM1'), '1 (8.33%)');
        });

        it('shows banner when no results retrieved', function() {
            clickCheckBox('Copy Number Alterations');
            clickCheckBox('Mutations');
            submit();
            assert($('div=No data/result available').isVisible());
        });

        it('filters mutation types', function() {
            clickCheckBox('Copy Number Alterations');
            submit();
            $('[data-test=LazyMobXTable]').waitForVisible();
            var rows = $$('[data-test=LazyMobXTable] tbody tr');
            assert.strictEqual(rows.length, 8);
            clickCheckBox('Mutations');
            clickCheckBox('Frameshift Insertion');
            submit();
            $('[data-test=LazyMobXTable]').waitForVisible();
            rows = $$('[data-test=LazyMobXTable] tbody tr');
            assert.strictEqual(rows.length, 2);
        });

        it('filters CNA types', function() {
            clickCheckBox('Mutations');
            submit();
            $('[data-test=LazyMobXTable]').waitForVisible();
            assert.strictEqual(selectUnalteredCount('ACAP3'), '9 (1.16%)');
            clickCheckBox('Copy Number Alterations');
            clickCheckBox('Amplification');
            submit();
            $('[data-test=LazyMobXTable]').waitForVisible();
            assert.strictEqual(selectUnalteredCount('ACAP3'), '7 (0.90%)');
        });
    });
}

var loadAltationsTab = url => {
    goToUrlAndSetLocalStorage(resultsViewComparisonTab);
    browser.waitForVisible('[data-test=GroupComparisonAlterationEnrichments]');
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

var clickCheckBox = name => {
    $('label=' + name)
        .$('input')
        .click();
};

var submit = () => {
    $('[data-test=changeSortOrderButton]').click();
    browser.waitForVisible('[data-test=GroupComparisonAlterationEnrichments]');
};

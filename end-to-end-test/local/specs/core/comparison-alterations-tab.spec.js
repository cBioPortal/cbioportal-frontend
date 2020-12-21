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
const mutationTypeCheckboxRefs = [
    'Missense',
    'FrameshiftDeletion',
    'FrameshiftInsertion',
    'Frameshift',
    'Nonsense',
    'Splice',
    'Nonstart',
    'Nonstop',
    'InframeDeletion',
    'InframeInsertion',
    'ColorByDriver',
    'Truncating',
    'Fusion',
    'Silent',
    'Other',
];

if (useExternalFrontend) {
    describe('comparison alterations tab', function() {
        beforeEach(() => {
            loadAlterationsTab();
        });

        it('unchecks all CNA types using the CNA master checkbox', function() {
            clickAlterationTypeCheckBox('Copy Number Alterations');
            assert(
                !$('input[data-test=DeepDeletion]').isSelected(),
                'unchecks Deep Deletion checkbox'
            );
            assert(
                !$('input[data-test=Amplification]').isSelected(),
                'unchecks Amplification checkbox'
            );
        });

        it('unchecks the master CNA checkbox when one CNA type is unchecked', function() {
            clickAlterationTypeCheckBox('Deep Deletion');
            assert(
                !$('input[data-test=CheckCopynumberAlterations]').isSelected(),
                'unchecks master Copy Number Alterations checkbox'
            );
        });

        it('checks all CNA types using the master CNA checkbox', function() {
            clickAlterationTypeCheckBox('Deep Deletion');
            clickAlterationTypeCheckBox('Copy Number Alterations');
            assert(
                $('input[data-test=DeepDeletion]').isSelected(),
                'checks Deep Deletion checkbox'
            );
            assert(
                $('input[data-test=Amplification]').isSelected(),
                'checks Amplification checkbox'
            );
        });

        it('checks the master CNA checkbox when all CNA types are checked', function() {
            clickAlterationTypeCheckBox('Deep Deletion');
            assert(
                !$('input[data-test=CheckCopynumberAlterations]').isSelected()
            );
            clickAlterationTypeCheckBox('Deep Deletion');
            assert(
                $('input[data-test=CheckCopynumberAlterations]').isSelected()
            );
        });

        it('unchecks all mutation types using the mutation master checkbox', function() {
            clickAlterationTypeCheckBox('Mutations');
            mutationTypeCheckboxRefs.forEach(typeSelect => {
                assert(
                    !$('input[data-test=' + typeSelect + ']').isSelected(),
                    'unchecks ' + typeSelect + ' checkbox'
                );
            });
        });

        it('unchecks the master mutation checkbox when one mutation type is unchecked', function() {
            clickAlterationTypeCheckBox('Missense');
            assert(
                !$('input[data-test=Mutations]').isSelected(),
                'unchecks master Mutations checkbox'
            );
        });

        it('checks all mutation using the master mutation checkbox', function() {
            clickAlterationTypeCheckBox('Missense');
            clickAlterationTypeCheckBox('Mutations');
            mutationTypeCheckboxRefs.forEach(typeSelect => {
                assert(
                    $('input[data-test=' + typeSelect + ']').isSelected(),
                    'checks ' + typeSelect + ' checkbox'
                );
            });
        });

        it('checks the master mutation checkbox when all mutation types are checked', function() {
            clickAlterationTypeCheckBox('Missense');
            assert(!$('input[data-test=Mutations]').isSelected());
            clickAlterationTypeCheckBox('Missense');
            assert($('input[data-test=Mutations]').isSelected());
        });

        it('shows basic counts', function() {
            var alteredCount = selectAlteredCount('ABLIM1');
            assert.strictEqual(selectAlteredCount('ABLIM1'), '1 (8.33%)');
        });

        it('shows banner when no results retrieved', function() {
            clickAlterationTypeCheckBox('Copy Number Alterations');
            clickAlterationTypeCheckBox('Mutations');
            submitEnrichmentRequest();
            assert($('div=No data/result available').isVisible());
        });

        it('filters mutation types', function() {
            clickAlterationTypeCheckBox('Copy Number Alterations');
            submitEnrichmentRequest();
            $('[data-test=LazyMobXTable]').waitForVisible();
            var rows = $$('[data-test=LazyMobXTable] tbody tr');
            assert.strictEqual(rows.length, 8);
            clickAlterationTypeCheckBox('Mutations');
            clickAlterationTypeCheckBox('Frameshift Insertion');
            submitEnrichmentRequest();
            $('[data-test=LazyMobXTable]').waitForVisible();
            rows = $$('[data-test=LazyMobXTable] tbody tr');
            assert.strictEqual(rows.length, 2);
        });

        it('filters CNA types', function() {
            clickAlterationTypeCheckBox('Mutations');
            submitEnrichmentRequest();
            $('[data-test=LazyMobXTable]').waitForVisible();
            assert.strictEqual(selectUnalteredCount('ACAP3'), '9 (1.16%)');
            clickAlterationTypeCheckBox('Deep Deletion');
            submitEnrichmentRequest();
            $('[data-test=LazyMobXTable]').waitForVisible();
            assert.strictEqual(selectUnalteredCount('ACAP3'), '7 (0.90%)');
        });
    });
}

// The loading of the tabs in comparison view is extremely fragile
// Multiple loading attempts are needed to make tests pass reliably.
var loadAlterationsTab = () => {
    goToUrlAndSetLocalStorage(resultsViewComparisonTab);
    browser.pause(3000);
    if ($('[data-test=GroupComparisonAlterationEnrichments]').isVisible()) {
        return;
    }
    goToUrlAndSetLocalStorage(resultsViewComparisonTab);
    browser.pause(4000);
    if ($('[data-test=GroupComparisonAlterationEnrichments]').isVisible()) {
        return;
    }
    goToUrlAndSetLocalStorage(resultsViewComparisonTab);
    browser.pause(5000);
    if ($('[data-test=GroupComparisonAlterationEnrichments]').isVisible())
        return;
    browser.waitForVisible(
        '[data-test=GroupComparisonAlterationEnrichments]',
        5000
    );
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
    browser.waitForVisible('[data-test=GroupComparisonAlterationEnrichments]');
};

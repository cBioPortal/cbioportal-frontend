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

const inframeCheckboxRefs = ['InFrame', 'InframeDeletion', 'InframeInsertion'];

const frameshiftCheckboxRefs = [
    'Frameshift',
    'FrameshiftDeletion',
    'FrameshiftInsertion',
];

const truncatingCheckboxRefs = [
    'Truncating',
    ...frameshiftCheckboxRefs,
    'Nonsense',
    'Splice',
    'Nonstart',
    'Nonstop',
];

const structvarCheckboxRefs = ['Fusion'];

const cnaCheckboxRefs = [
    'CheckCopynumberAlterations',
    'DeepDeletion',
    'Amplification',
];

const mutationTypeCheckboxRefs = [
    'Missense',
    ...inframeCheckboxRefs,
    ...truncatingCheckboxRefs,
    'Other',
];

if (useExternalFrontend) {
    describe('comparison alterations tab', function() {
        beforeEach(() => {
            loadAlterationsTab();
        });

        // -+=+ CNA +=+-
        it('unchecks all CNA types using the CNA master checkbox', function() {
            clickAlterationTypeCheckBox('Copy Number Alterations');
            assert(
                cnaCheckboxRefs.every(
                    ref => !$('input[data-test=' + ref + ']').isSelected()
                ),
                'unchecks all CNA checkboxes'
            );
        });

        it('unchecks the master CNA checkbox when one CNA type is unchecked', function() {
            clickAlterationTypeCheckBox('Deletion');
            assert(
                !$('input[data-test=CheckCopynumberAlterations]').isSelected(),
                'unchecks master Copy Number Alterations checkbox'
            );
        });

        it('checks all CNA types using the master CNA checkbox', function() {
            clickAlterationTypeCheckBox('Deletion');
            clickAlterationTypeCheckBox('Copy Number Alterations');
            assert(
                cnaCheckboxRefs.every(ref =>
                    $('input[data-test=' + ref + ']').isSelected()
                ),
                'checks all CNA checkboxes'
            );
        });

        it('checks the master CNA checkbox when all CNA types are checked', function() {
            clickAlterationTypeCheckBox('Deletion');
            assert(
                !$('input[data-test=CheckCopynumberAlterations]').isSelected()
            );
            clickAlterationTypeCheckBox('Deletion');
            assert(
                $('input[data-test=CheckCopynumberAlterations]').isSelected()
            );
        });

        // -+=+ INFRAME MUTATION +=+-
        it('unchecks all inframe mutation types using the inframe mutation master checkbox', function() {
            clickAlterationTypeCheckBox('Inframe');
            assert(
                inframeCheckboxRefs.every(
                    ref => !$('input[data-test=' + ref + ']').isSelected()
                ),
                'unchecks all inframe mutation checkboxes'
            );
        });

        it('unchecks the master inframe mutation checkbox when one inframe mutation type is unchecked', function() {
            clickAlterationTypeCheckBox('Inframe Insertion');
            assert(
                !$('input[data-test=InFrame]').isSelected(),
                'unchecks master inframe mutation checkbox'
            );
        });

        it('checks all inframe mutation types using the master inframe mutation checkbox', function() {
            clickAlterationTypeCheckBox('Inframe Insertion');
            clickAlterationTypeCheckBox('Inframe');
            assert(
                inframeCheckboxRefs.every(ref =>
                    $('input[data-test=' + ref + ']').isSelected()
                ),
                'checks all inframe mutation checkboxes'
            );
        });

        it('checks the master inframe mutation checkbox when all inframe mutation types are checked', function() {
            clickAlterationTypeCheckBox('Inframe Insertion');
            assert(!$('input[data-test=InFrame]').isSelected());
            clickAlterationTypeCheckBox('Inframe Insertion');
            assert($('input[data-test=InFrame]').isSelected());
        });

        // -+=+ FRAMESHIFT MUTATION +=+-
        it('unchecks all frameshift mutation types using the frameshift mutation master checkbox', function() {
            clickAlterationTypeCheckBox('Frameshift');
            assert(
                frameshiftCheckboxRefs.every(
                    ref => !$('input[data-test=' + ref + ']').isSelected()
                ),
                'unchecks all frameshift mutation checkboxes'
            );
        });

        it('unchecks the master frameshift mutation checkbox when one frameshift mutation type is unchecked', function() {
            clickAlterationTypeCheckBox('Frameshift Insertion');
            assert(
                !$('input[data-test=Frameshift]').isSelected(),
                'unchecks master frameshift mutation checkbox'
            );
        });

        it('checks all frameshift mutation types using the master frameshift mutation checkbox', function() {
            clickAlterationTypeCheckBox('Frameshift Insertion');
            clickAlterationTypeCheckBox('Frameshift');
            assert(
                frameshiftCheckboxRefs.every(ref =>
                    $('input[data-test=' + ref + ']').isSelected()
                ),
                'checks all frameshift mutation checkboxes'
            );
        });

        it('checks the master frameshift mutation checkbox when all frameshift mutation types are checked', function() {
            clickAlterationTypeCheckBox('Frameshift Insertion');
            assert(!$('input[data-test=Frameshift]').isSelected());
            clickAlterationTypeCheckBox('Frameshift Insertion');
            assert($('input[data-test=Frameshift]').isSelected());
        });

        // -+=+ TRUNCATING MUTATION +=+-
        it('unchecks all truncating mutation types using the truncating mutation master checkbox', function() {
            clickAlterationTypeCheckBox('Truncating');
            assert(
                truncatingCheckboxRefs.every(
                    ref => !$('input[data-test=' + ref + ']').isSelected()
                ),
                'unchecks all truncating mutation checkboxes'
            );
        });

        it('unchecks the master truncating mutation checkbox when one truncating mutation type is unchecked', function() {
            clickAlterationTypeCheckBox('Nonsense');
            assert(
                !$('input[data-test=Truncating]').isSelected(),
                'unchecks master truncating mutation checkbox'
            );
        });

        it('checks all truncating mutation types using the master truncating mutation checkbox', function() {
            clickAlterationTypeCheckBox('Nonsense');
            clickAlterationTypeCheckBox('Truncating');
            assert(
                truncatingCheckboxRefs.every(ref =>
                    $('input[data-test=' + ref + ']').isSelected()
                ),
                'checks all truncating mutation checkboxes'
            );
        });

        it('checks the master truncating mutation checkbox when all truncating mutation types are checked', function() {
            clickAlterationTypeCheckBox('Nonsense');
            assert(!$('input[data-test=Truncating]').isSelected());
            clickAlterationTypeCheckBox('Nonsense');
            assert($('input[data-test=Truncating]').isSelected());
        });

        // -+=+ MUTATION +=+-
        it('unchecks all mutation types using the mutation master checkbox', function() {
            clickAlterationTypeCheckBox('Mutations');
            assert(
                mutationTypeCheckboxRefs.every(
                    ref => !$('input[data-test=' + ref + ']').isSelected()
                ),
                'unchecks all mutation checkboxes'
            );
        });

        it('unchecks the master mutation checkbox when one mutation type is unchecked', function() {
            clickAlterationTypeCheckBox('Missense');
            assert(
                !$('input[data-test=Mutations]').isSelected(),
                'unchecks master mutation checkbox'
            );
        });

        it('checks all mutation types using the master mutation checkbox', function() {
            clickAlterationTypeCheckBox('Missense');
            clickAlterationTypeCheckBox('Mutations');
            assert(
                mutationTypeCheckboxRefs.every(ref =>
                    $('input[data-test=' + ref + ']').isSelected()
                ),
                'checks all mutation checkboxes'
            );
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
            clickAlterationTypeCheckBox('Structural variants / Fusions');
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

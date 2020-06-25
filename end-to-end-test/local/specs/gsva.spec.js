var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForStudyQueryPage = require('../../shared/specUtils')
    .waitForStudyQueryPage;
var waitForGeneQueryPage = require('../../shared/specUtils')
    .waitForGeneQueryPage;
var waitForOncoprint = require('../../shared/specUtils').waitForOncoprint;
var waitForPlotsTab = require('../../shared/specUtils').waitForPlotsTab;
var waitForCoExpressionTab = require('../../shared/specUtils')
    .waitForCoExpressionTab;
var reactSelectOption = require('../../shared/specUtils').reactSelectOption;
var getReactSelectOptions = require('../../shared/specUtils')
    .getReactSelectOptions;
var selectReactSelectOption = require('../../shared/specUtils')
    .selectReactSelectOption;
var useExternalFrontend = require('../../shared/specUtils').useExternalFrontend;

var { clickQueryByGeneButton, showGsva } = require('../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=GO_ACYLGLYCEROL_HOMEOSTASIS%20GO_ANATOMICAL_STRUCTURE_FORMATION_INVOLVED_IN_MORPHOGENESIS%20GO_ANTEROGRADE_AXONAL_TRANSPORT%20GO_APICAL_PROTEIN_LOCALIZATION%20GO_ATP_DEPENDENT_CHROMATIN_REMODELING%20GO_CARBOHYDRATE_CATABOLIC_PROCESS%20GO_CARDIAC_CHAMBER_DEVELOPMENT&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_GENESET_SCORE=study_es_0_gsva_scores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&tab_index=tab_visualize&show_samples=false&clinicallist=PROFILED_IN_study_es_0_gsva_scores%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic';
const plotsTabUrl =
    CBIOPORTAL_URL +
    '/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&clinicallist=PROFILED_IN_study_es_0_gsva_scores%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=GO_ACYLGLYCEROL_HOMEOSTASIS%20GO_ANATOMICAL_STRUCTURE_FORMATION_INVOLVED_IN_MORPHOGENESIS%20GO_ANTEROGRADE_AXONAL_TRANSPORT%20GO_APICAL_PROTEIN_LOCALIZATION%20GO_ATP_DEPENDENT_CHROMATIN_REMODELING%20GO_CARBOHYDRATE_CATABOLIC_PROCESS%20GO_CARDIAC_CHAMBER_DEVELOPMENT&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_GENESET_SCORE=study_es_0_gsva_scores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize';
const coexpressionTabUrl =
    CBIOPORTAL_URL +
    '/results/coexpression?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_gsva_scores%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=CREB3L1%2520RPS11%2520PNMA1%2520MMP2%2520ZHX3%2520ERCC5&geneset_list=GO_ATP_DEPENDENT_CHROMATIN_REMODELING%20GO_ACYLGLYCEROL_HOMEOSTASIS%20GO_ANATOMICAL_STRUCTURE_FORMATION_INVOLVED_IN_MORPHOGENESIS%20GO_ANTEROGRADE_AXONAL_TRANSPORT%20GO_APICAL_PROTEIN_LOCALIZATION%20GO_CARBOHYDRATE_CATABOLIC_PROCESS%20GO_CARDIAC_CHAMBER_DEVELOPMENT&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_GENESET_SCORE=study_es_0_gsva_scores&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize%27';

describe('gsva feature', function() {
    //this.retries(2);

    if (useExternalFrontend) {
        describe('query page', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
                showGsva();
                waitForStudyQueryPage();
            });

            it('shows GSVA-profile option when selecting study_es_0', () => {
                checkTestStudy();

                var gsvaProfileCheckbox = browser.$(
                    '[data-test=GENESET_SCORE]'
                );
                assert(gsvaProfileCheckbox.isVisible());
            });

            it('shows gene set entry component when selecting gsva-profile data type', () => {
                checkTestStudy();
                checkGSVAprofile();

                assert(browser.$('h2=Enter Gene Sets:').isVisible());
                assert(
                    browser
                        .$('[data-test=GENESET_HIERARCHY_BUTTON]')
                        .isVisible()
                );
                assert(
                    browser.$('[data-test=GENESET_VOLCANO_BUTTON]').isVisible()
                );
                assert(browser.$('[data-test=GENESETS_TEXT_AREA]').isVisible());
            });

            it('adds gene set parameter to url after submit', () => {
                checkTestStudy();
                checkGSVAprofile();

                browser.setValue(
                    '[data-test=GENESETS_TEXT_AREA]',
                    'GO_ATP_DEPENDENT_CHROMATIN_REMODELING'
                );
                browser.setValue('[data-test=geneSet]', 'TP53');
                var queryButton = browser.$('[data-test=queryButton]');
                queryButton.waitForEnabled();
                queryButton.click();
                var url = browser.url().value;
                var regex = /geneset_list=GO_ATP_DEPENDENT_CHROMATIN_REMODELING/;
                assert(url.match(regex));
            });
        });

        describe('GenesetsHierarchySelector', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
                showGsva();
                waitForStudyQueryPage();
                checkTestStudy();
                checkGSVAprofile();
                browser.$('button[data-test=GENESET_HIERARCHY_BUTTON]').click();
                waitForGsvaHierarchyDialog();
            });

            it('adds gene set name to entry component from hierachy selector', () => {
                $('*=GO_ATP_DEPENDENT_CHROMATIN_REMODELING').waitForExist();

                var checkBox = $('*=GO_ATP_DEPENDENT_CHROMATIN_REMODELING');
                checkBox.click();

                // wait for jstree to process the click
                checkBox.$('.jstree-clicked').waitForExist();

                browser.$('button=Select').click();

                $('span*=All gene sets are valid').waitForExist();

                var textArea = browser.$('[data-test=GENESETS_TEXT_AREA]');
                assert.equal(
                    textArea.getText(),
                    'GO_ATP_DEPENDENT_CHROMATIN_REMODELING'
                );
            });

            it('filters gene sets with the GSVA score input field', () => {
                var before = $$('*=GO_');

                browser.$('[id=GSVAScore]').setValue('0');
                browser.$('[id=filterButton]').click();

                browser.waitUntil(() => $$('*=GO_').length > before.length);
                var after = $$('*=GO_');

                assert.equal(after.length, 7);
            });

            it('filters gene sets with the search input field', () => {
                var before = $$('*=GO_');

                browser.$('[id=GSVAScore]').setValue('0');
                browser.$('[id=filterButton]').click();

                browser.waitUntil(() => $$('*=GO_').length > before.length);

                $('[id=geneset-hierarchy-search]').setValue(
                    'GO_ACYLGLYCEROL_HOMEOSTASIS'
                );
                assert($('*=GO_ACYLGLYCEROL_HOMEOSTASIS'));
            });

            it('filters gene sets with the gene set pvalue input field', () => {
                var before = $$('*=GO_');

                browser.$('[id=Pvalue]').setValue('0.0005');
                browser.$('[id=filterButton]').click();

                browser.waitUntil(() => $$('*=GO_').length < before.length);
                var after = $$('*=GO_');

                assert.equal(after.length, 0);
            });

            it('filters gene sets with the gene set percentile select box', () => {
                var before = $$('*=GO_');

                var modal = $('div.modal-body');
                modal.$('.Select-value-label').click();
                modal.$('.Select-option=100%').click();
                modal.$('[id=filterButton]').click();

                browser.waitUntil(() => $$('*=GO_').length > before.length);
                var after = $$('*=GO_');

                assert.equal(after.length, 2);
            });
        });

        describe('GenesetVolcanoPlotSelector', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
                showGsva();
                waitForStudyQueryPage();
                checkTestStudy();
                checkGSVAprofile();
            });

            it('adds gene set name to entry component', () => {
                console.log('A');
                $('button[data-test=GENESET_VOLCANO_BUTTON]').waitForExist();
                console.log('B');
                browser.$('button[data-test=GENESET_VOLCANO_BUTTON]').click();
                console.log('C');
                $('div.modal-dialog').waitForExist();
                console.log('D');
                // find the GO_ATP_DEPENDENT_CHROMATIN_REMODELING entry and check its checkbox
                $('span=GO_ATP_DEPENDENT_CHROMATIN_REMODELING').waitForExist();
                var checkBox = $('span=GO_ATP_DEPENDENT_CHROMATIN_REMODELING')
                    .$('..')
                    .$('..')
                    .$$('td')[3]
                    .$('label input');
                console.log('E');
                checkBox.waitForVisible();
                console.log('F');
                browser.waitUntil(() => {
                    checkBox.click();
                    return checkBox.isSelected();
                });

                console.log('G');
                $('button=Add selection to the query').waitForExist();
                console.log('H');
                browser.$('button=Add selection to the query').click();

                console.log('I');
                $('span*=All gene sets are valid').waitForExist();

                console.log('J');
                var textArea = browser.$('[data-test=GENESETS_TEXT_AREA]');
                console.log('K');
                textArea.waitForExist();
                console.log('L');
                assert.equal(
                    textArea.getText(),
                    'GO_ATP_DEPENDENT_CHROMATIN_REMODELING'
                );
            });

            it('selects gene sets from query page text area', () => {
                var textArea = browser.$('[data-test=GENESETS_TEXT_AREA]');
                textArea.setValue('GO_ATP_DEPENDENT_CHROMATIN_REMODELING');

                browser.$('button[data-test=GENESET_VOLCANO_BUTTON]').click();

                $('div.modal-dialog').waitForExist();

                var checkBox = $('span=GO_ATP_DEPENDENT_CHROMATIN_REMODELING')
                    .$('..')
                    .$('..')
                    .$$('td')[3]
                    .$('label input');

                assert(checkBox.isSelected());
            });

            it('reset keeps gene sets from query page text area', () => {
                var textArea = browser.$('[data-test=GENESETS_TEXT_AREA]');
                textArea.setValue('GO_ATP_DEPENDENT_CHROMATIN_REMODELING');

                browser.$('button[data-test=GENESET_VOLCANO_BUTTON]').click();

                $('div.modal-dialog').waitForExist();

                var checkBox = $('span=GO_ATP_DEPENDENT_CHROMATIN_REMODELING')
                    .$('..')
                    .$('..')
                    .$$('td')[3]
                    .$('label input');
                $('button=Clear selection').click();

                assert(checkBox.isSelected());
            });

            it('searchbox filters gene set list', () => {
                browser.$('button[data-test=GENESET_VOLCANO_BUTTON]').click();

                $('div.modal-dialog').waitForExist();

                browser.waitUntil(() => $$('span*=GO_').length > 5);

                const lengthBefore = $$('span*=GO_').length;

                $('input.tableSearchInput').waitForExist();
                $('input.tableSearchInput').setValue('GO_ACYL');

                browser.waitUntil(() => $$('span*=GO_').length < lengthBefore);

                const lengthAfter = $$('span*=GO_').length;

                assert.equal(lengthAfter, 1);
            });
        });

        describe('results view page', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(oncoprintTabUrl);
                waitForOncoprint();
            });

            it('shows co-expression tab when genes with expression data selected', () => {
                assert($('ul.nav-tabs li.tabAnchor_coexpression'));
            });
        });

        describe('oncoprint tab', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(oncoprintTabUrl);
                waitForOncoprint();
            });

            it('has GSVA profile option in heatmap menu', () => {
                var heatmapButton = browser.$('button[id=heatmapDropdown]');
                heatmapButton.click();
                var heatmapDropdown = browser.$$(
                    '.dropdown-menu.heatmap .Select-control'
                )[0];
                heatmapDropdown.click();
                assert(
                    $(
                        'div=GSVA scores on oncogenic signatures gene sets'
                    ).isVisible()
                );
            });
        });

        describe('plots tab', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(plotsTabUrl);
                waitForPlotsTab();
            });

            it('shows gsva option in horizontal data type selection box', () => {
                var horzDataSelect = $('[name=h-profile-type-selector]').$(
                    '..'
                );
                horzDataSelect.$('.Select-value-label').click();
                assert(horzDataSelect.$('.Select-option=Gene Sets'));
            });

            it('shows gsva option in vertical data type selection box', () => {
                var vertDataSelect = $('[name=v-profile-type-selector]').$(
                    '..'
                );
                vertDataSelect.$('.Select-value-label').click();
                assert(vertDataSelect.$('.Select-option=Gene Sets'));
            });

            it('horizontal axis menu shows gsva score and pvalue in profile menu', () => {
                var horzDataSelect = $('[name=h-profile-type-selector]').$(
                    '..'
                );
                horzDataSelect.$('.Select-value-label').click();
                horzDataSelect.$('.Select-option=Gene Sets').click();

                var horzProfileSelect = $('[name=h-profile-name-selector]').$(
                    '..'
                );
                horzProfileSelect.$('.Select-value-label').click();

                assert(
                    horzProfileSelect.$(
                        '.Select-option=GSVA scores on oncogenic signatures gene sets'
                    )
                );
                assert(
                    horzProfileSelect.$(
                        '.Select-option=Pvalues of GSVA scores on oncogenic signatures gene sets'
                    )
                );
            });

            it('vertical axis menu shows gsva score and pvalue in profile menu', () => {
                var vertDataSelect = $('[name=v-profile-type-selector]').$(
                    '..'
                );
                vertDataSelect.$('.Select-value-label').click();
                vertDataSelect.$('.Select-option=Gene Sets').click();

                var vertProfileSelect = $('[name=v-profile-name-selector]').$(
                    '..'
                );
                vertProfileSelect.$('.Select-value-label').click();

                assert(
                    vertProfileSelect.$(
                        '.Select-option=GSVA scores on oncogenic signatures gene sets'
                    )
                );
                assert(
                    vertProfileSelect.$(
                        '.Select-option=Pvalues of GSVA scores on oncogenic signatures gene sets'
                    )
                );
            });

            it('horizontal axis menu shows gene set entry in entity menu', () => {
                var horzDataSelect = $('[name=h-profile-type-selector]').$(
                    '..'
                );
                horzDataSelect.$('.Select-value-label').click();
                horzDataSelect.$('.Select-option=Gene Sets').click();

                var horzProfileSelect = $('[name=h-profile-name-selector]').$(
                    '..'
                );
                horzProfileSelect.$('.Select-value-label').click();
                horzProfileSelect
                    .$(
                        '.Select-option=Pvalues of GSVA scores on oncogenic signatures gene sets'
                    )
                    .click();

                var horzEntitySelect = $('[name=h-geneset-selector]').$('..');
                horzEntitySelect.$('.Select-value-label').click();

                assert(
                    horzEntitySelect.$(
                        '.Select-option=GO_ATP_DEPENDENT_CHROMATIN_REMODELING'
                    )
                );
            });

            it('vertical axis menu shows gene set entry in entity menu', () => {
                var vertDataSelect = $('[name=v-profile-type-selector]').$(
                    '..'
                );
                vertDataSelect.$('.Select-value-label').click();
                vertDataSelect.$('.Select-option=Gene Sets').click();

                var vertProfileSelect = $('[name=v-profile-name-selector]').$(
                    '..'
                );
                vertProfileSelect.$('.Select-value-label').click();
                vertProfileSelect
                    .$(
                        '.Select-option=Pvalues of GSVA scores on oncogenic signatures gene sets'
                    )
                    .click();

                var vertEntitySelect = $('[name=v-geneset-selector]').$('..');
                vertEntitySelect.$('.Select-value-label').click();

                assert(
                    vertEntitySelect.$(
                        '.Select-option=GO_ATP_DEPENDENT_CHROMATIN_REMODELING'
                    )
                );
            });
        });

        describe('co-expression tab', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(coexpressionTabUrl);
                waitForCoExpressionTab();
            });

            it('shows buttons for genes', () => {
                const genes = coexpressionTabUrl
                    .match(/gene_list=(.*)\&/)[1]
                    .split('%20');
                var container = $('//*[@id="coexpressionTabGeneTabs"]');
                var icons = genes.map(g => container.$('a=' + g));
                assert.equal(genes.length, icons.length);
            });

            it('shows buttons for genes and gene sets', () => {
                const geneSets = coexpressionTabUrl
                    .match(/geneset_list=(.*)\&/)[1]
                    .split('%20');
                var container = $('//*[@id="coexpressionTabGeneTabs"]');
                var icons = geneSets.map(g => container.$('a=' + g));
                assert.equal(geneSets.length, icons.length);
            });

            it('shows mRNA expression/GSVA scores in query profile select box when reference gene selected', () => {
                var icon = $('//*[@id="coexpressionTabGeneTabs"]').$('a=RPS11');
                icon.click();
                $('//*[@id="coexpressionTabGeneTabs"]').waitForExist();
                assert.equal(
                    getReactSelectOptions(
                        $('.coexpression-select-query-profile')
                    ).length,
                    2
                );
                assert(
                    reactSelectOption(
                        $('.coexpression-select-query-profile'),
                        'mRNA expression (microarray) (526 samples)'
                    )
                );
                assert(
                    reactSelectOption(
                        $('.coexpression-select-query-profile'),
                        'GSVA scores on oncogenic signatures gene sets (5 samples)'
                    )
                );
            });

            it('shows mRNA expression in subject profile select box when reference gene selected', () => {
                var icon = $('//*[@id="coexpressionTabGeneTabs"]').$('a=RPS11');
                icon.click();
                $('//*[@id="coexpressionTabGeneTabs"]').waitForExist();
                assert.equal(
                    getReactSelectOptions(
                        $('.coexpression-select-subject-profile')
                    ).length,
                    1
                );
                assert(
                    reactSelectOption(
                        $('.coexpression-select-subject-profile'),
                        'mRNA expression (microarray) (526 samples)'
                    )
                );
            });

            it('shows name of gene in `correlated with` field when reference gene selected', () => {
                var icon = $('//*[@id="coexpressionTabGeneTabs"]').$('a=RPS11');
                icon.click();
                $('//*[@id="coexpressionTabGeneTabs"]').waitForExist();
                var text = $('span*=that are correlated').getText();
                assert(text.match('RPS11'));
            });

            it('shows mRNA expression/GSVA scores in subject profile box when reference gene set selected', () => {
                var icon = $('//*[@id="coexpressionTabGeneTabs"]').$(
                    'a=GO_ACYLGLYCEROL_HOMEOSTASIS'
                );
                icon.click();
                $('//*[@id="coexpressionTabGeneTabs"]').waitForExist();
                assert.equal(
                    getReactSelectOptions(
                        $('.coexpression-select-query-profile')
                    ).length,
                    2
                );
                assert(
                    reactSelectOption(
                        $('.coexpression-select-query-profile'),
                        'mRNA expression (microarray) (526 samples)'
                    )
                );
                assert(
                    reactSelectOption(
                        $('.coexpression-select-query-profile'),
                        'GSVA scores on oncogenic signatures gene sets (5 samples)'
                    )
                );
            });

            it('shows disabled subject query select box when reference gene set selected', () => {
                var icon = $('//*[@id="coexpressionTabGeneTabs"]').$(
                    'a=GO_ACYLGLYCEROL_HOMEOSTASIS'
                );
                icon.click();
                $('//*[@id="coexpressionTabGeneTabs"]').waitForExist();
                assert($('.coexpression-select-subject-profile.is-disabled '));
                assert(
                    $('.coexpression-select-subject-profile').$(
                        '.Select-value-label*=GSVA scores on oncogenic'
                    )
                );
            });

            it('shows gene sets in table when GSVA scores selected in subject profile select box', () => {
                selectReactSelectOption(
                    $('.coexpression-select-query-profile'),
                    'GSVA scores on oncogenic signatures gene sets (5 samples)'
                );
                $('//*[@id="coexpressionTabGeneTabs"]').waitForExist();
                $('span*=GO_').waitForExist();
                assert.equal($$('span*=GO_').length, 7);
            });

            it('shows `Enter gene set.` placeholder in table search box when GSVA scores selected in first select box', () => {
                selectReactSelectOption(
                    $('.coexpression-select-query-profile'),
                    'GSVA scores on oncogenic signatures gene sets (5 samples)'
                );
                $('//*[@id="coexpressionTabGeneTabs"]').waitForExist();
                assert(
                    $(
                        '[data-test=CoExpressionGeneTabContent] input[placeholder="Enter gene set.."]'
                    )
                );
            });
        });
    }
});

const checkTestStudy = () => {
    // check the'Test study es_0' checkbox
    $('span=Test study es_0').waitForExist();
    var checkbox = $('span=Test study es_0')
        .$('..')
        .$('input[type=checkbox]');
    checkbox.click();
    clickQueryByGeneButton();
    waitForGeneQueryPage();
};

const checkGSVAprofile = () => {
    $('[data-test=GENESET_SCORE]').waitForExist();
    var gsvaProfileCheckbox = browser.$('[data-test=GENESET_SCORE]');
    gsvaProfileCheckbox.click();
    $('[data-test=GENESETS_TEXT_AREA]').waitForExist();
};

const waitForGsvaHierarchyDialog = () => {
    $('div.modal-dialog').waitForExist();
    $('div[data-test=gsva-tree-container] ul').waitForExist();
};

module.exports = {
    checkTestStudy: checkTestStudy,
    checkGSVAprofile: checkGSVAprofile,
    queryPageUrl: CBIOPORTAL_URL,
    oncoprintTabUrl: oncoprintTabUrl,
    plotsTabUrl: plotsTabUrl,
    coexpressionTabUrl: coexpressionTabUrl,
};

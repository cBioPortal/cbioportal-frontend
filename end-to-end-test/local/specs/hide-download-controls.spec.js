var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForStudyQueryPage = require('../../shared/specUtils')
    .waitForStudyQueryPage;
var waitForOncoprint = require('../../shared/specUtils').waitForOncoprint;
var useExternalFrontend = require('../../shared/specUtils').useExternalFrontend;
var waitForPatientView = require('../../shared/specUtils').waitForPatientView;
var waitForStudyView = require('../../shared/specUtils').waitForStudyView;
var studyViewChartHoverHamburgerIcon = require('../../shared/specUtils')
    .studyViewChartHoverHamburgerIcon;
var setServerConfiguration = require('../../shared/specUtils')
    .setServerConfiguration;
var openGroupComparison = require('../../shared/specUtils').openGroupComparison;
var waitForNetworkQuiet = require('../../shared/specUtils').waitForNetworkQuiet;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const downloadIcon = '.fa-download';
const downloadCloudIcon = '.fa-cloud-download';
const clipboardIcon = '.fa-clipboard';

describe('hide download controls feature', function() {
    if (useExternalFrontend) {
        describe('study query page', () => {
            const expectedTabNames = ['Query'];

            before(() => {
                openAndSetProperty(CBIOPORTAL_URL, {
                    skin_hide_download_controls: true,
                });
                // browser.debug();
                waitForStudyQueryPage();
                waitForTabs(expectedTabNames.length);
            });

            it('covers all tabs with download control tests', () => {
                const observedTabNames = $$('.tabAnchor')
                    .filter(a => a.isDisplayed())
                    .map(a => a.getText());
                assert.deepStrictEqual(
                    expectedTabNames,
                    observedTabNames,
                    'There appears to be a new tab on the page (observed names: [' +
                        observedTabNames.join(', ') +
                        '] expected names: [' +
                        expectedTabNames.join(', ') +
                        ']). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include' +
                        ' tests for this in hide-download-controls.spec.js.'
                );
            });

            it('global check for icon and occurrence of "Download" as a word', () => {
                globalCheck();
            });

            it('does not show Download tab', () => {
                assert(!$('.tabAnchor_download').isExisting());
            });

            it('does not show download icons data sets in study rows', () => {
                goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/datasets`, true);
                $('[data-test=LazyMobXTable]').waitForExist();
                assert(!$(downloadIcon).isExisting());
            });
        });

        describe('results view page', () => {
            const expectedTabNames = [
                'OncoPrint',
                'Cancer Types Summary',
                'Mutual Exclusivity',
                'Plots',
                'Mutations',
                'Co-expression',
                'Comparison/Survival',
                'CN Segments',
                'Pathways',
            ];
            before(() => {
                openAndSetProperty(
                    `${CBIOPORTAL_URL}/results/oncoprint?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=mutations%2Cfusion%2Cgistic&case_set_id=study_es_0_cnaseq&gene_list=CREB3L1%2520RPS11%2520PNMA1%2520MMP2%2520ZHX3%2520ERCC5%2520TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit&comparison_subtab=mrna`,
                    { skin_hide_download_controls: true }
                );
                waitForOncoprint();
                waitForTabs(expectedTabNames.length);
            });

            it('covers all tabs with download control tests', () => {
                const observedTabNames = $$('.tabAnchor')
                    .filter(a => a.isDisplayed())
                    .map(a => a.getText());
                assert.deepStrictEqual(
                    expectedTabNames,
                    observedTabNames,
                    'There appears to be a new tab on the page (observed names: [' +
                        observedTabNames.join(', ') +
                        '] expected names: [' +
                        expectedTabNames.join(', ') +
                        ']). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include' +
                        ' tests for this in hide-download-controls.spec.js.'
                );
            });

            describe('oncoprint', () => {
                it('does not show download/clipboard icons and does not contain the word "Download"', () => {
                    globalCheck();
                });
            });

            describe('cancer type summary', () => {
                it('does not show download/clipboard icons and does not contain the word "Download"', () => {
                    $('.tabAnchor_cancerTypesSummary').click();
                    $('[data-test=cancerTypeSummaryChart]').waitForExist();
                    globalCheck();
                });
            });

            describe('mutual exclusivity', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_mutualExclusivity').click();
                    $('[data-test=LazyMobXTable]').waitForExist();
                    globalCheck();
                });
            });

            describe('plots', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_plots').click();
                    $('=mRNA vs mut type').waitForExist();
                    $('=mRNA vs mut type').click();
                    $('[data-test=PlotsTabPlotDiv]').waitForExist();
                    globalCheck();
                });
            });

            describe('mutations', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_mutations').click();
                    $('[data-test=LollipopPlot]').waitForExist();
                    $('.tabAnchor_TP53').click();
                    $('[data-test=LollipopPlot]').waitForExist();
                    globalCheck();
                    // $('[data-test=view3DStructure]').click();
                    // $('.borderedChart canvas').waitForExist();
                    // globalCheck();
                });
            });

            describe('co-expression', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_coexpression').click();
                    $('#coexpression-plot-svg').waitForExist();
                    globalCheck();
                });
            });

            describe('comparison/survival', () => {
                before(() => {
                    $('.tabAnchor_comparison').click();
                });
                it('covers all tabs with download control tests', () => {
                    $('.tabAnchor_overlap').waitForExist();
                    const expectedTabNames = [
                        'Overlap',
                        'Survival',
                        'Clinical',
                        'Genomic Alterations',
                        'mRNA',
                        'DNA Methylation',
                        'Treatment Response',
                        'Mutational Signature',
                    ];
                    const observedTabNames = $$(
                        '[data-test=ComparisonTabDiv] .tabAnchor'
                    )
                        .filter(a => a.isDisplayed())
                        .map(a => a.getText());
                    assert.deepStrictEqual(
                        expectedTabNames,
                        observedTabNames,
                        'There appears to be a new tab on the page (observed names: [' +
                            observedTabNames.join(', ') +
                            '] expected names: [' +
                            expectedTabNames.join(', ') +
                            ']). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include' +
                            ' tests for this in hide-download-controls.spec.js.'
                    );
                });
                describe('overlap tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', () => {
                        $('.tabAnchor_overlap').click();
                        $(
                            '[data-test=ComparisonPageOverlapTabContent]'
                        ).waitForExist();
                        globalCheck();
                    });
                });
                describe('survival tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', () => {
                        $('.tabAnchor_survival').click();
                        $('[data-test=SurvivalChart]').waitForExist();
                        globalCheck();
                    });
                });
                describe('clinical tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', () => {
                        $('.tabAnchor_clinical').click();
                        $('[data-test=ClinicalTabPlotDiv]').waitForExist();
                        globalCheck();
                    });
                });
                describe('alterations tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', () => {
                        $('.tabAnchor_alterations').click();
                        $('[data-test=LazyMobXTable]').waitForExist();
                        globalCheck();
                    });
                });
                describe('mrna tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', () => {
                        $('.tabAnchor_mrna').click();
                        $(
                            '[data-test=GroupComparisonMRNAEnrichments]'
                        ).waitForExist();
                        $$(
                            '[data-test=GroupComparisonMRNAEnrichments] tbody tr b'
                        )[0].click();
                        $('[data-test=MiniBoxPlot]').waitForExist();
                        globalCheck();
                    });
                });
                describe('dna_methylation tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', () => {
                        $('.tabAnchor_dna_methylation').click();
                        $(
                            '[data-test=GroupComparisonMethylationEnrichments]'
                        ).waitForExist();
                        $$(
                            '[data-test=GroupComparisonMethylationEnrichments] tbody tr b'
                        )[0].click();
                        $('[data-test=MiniBoxPlot]').waitForExist();
                        globalCheck();
                    });
                });
                describe('treatment response tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', () => {
                        $(
                            '.tabAnchor_generic_assay_treatment_response'
                        ).click();
                        $(
                            '[data-test=GroupComparisonGenericAssayEnrichments]'
                        ).waitForExist();
                        $$(
                            '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b'
                        )[0].click();
                        $('[data-test=MiniBoxPlot]').waitForExist();
                        globalCheck();
                    });
                });
                describe('mutational signature tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', () => {
                        $(
                            '.tabAnchor_generic_assay_mutational_signature'
                        ).click();
                        $(
                            '[data-test=GroupComparisonGenericAssayEnrichments]'
                        ).waitForExist();
                        $$(
                            '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b'
                        )[1].click(); // first row is invisible treatment response 'Name of 17-AAG'
                        $('[data-test=MiniBoxPlot]').waitForExist();
                        globalCheck();
                    });
                });

                describe('CN segments', () => {
                    before(() => {
                        $('.tabAnchor_cnSegments').click();
                        $('.igvContainer').waitForExist();
                    });
                    it('global check for icon and occurrence of "Download" as a word', () => {
                        globalCheck();
                    });
                });

                describe('pathways', () => {
                    before(() => {
                        $('.tabAnchor_pathways').click();
                        $('.pathwayMapper').waitForExist();
                    });
                    it('global check for icon and occurrence of "Download" as a word', () => {
                        globalCheck();
                    });
                });

                it('does not show Download tab', () => {
                    assert(!$('.tabAnchor_download').isExisting());
                });
            });
        });

        describe('patient view', () => {
            const expectedTabNames = [
                'Summary',
                'Pathways',
                'Clinical Data',
                'Files & Links',
                'Tissue Image',
                'Pathology Slide',
                'Study Sponsors',
            ];
            before(() => {
                openAndSetProperty(
                    `${CBIOPORTAL_URL}/patient?studyId=study_es_0&caseId=TCGA-A1-A0SK`,
                    { skin_hide_download_controls: true }
                );
                waitForPatientView();
                waitForTabs(expectedTabNames.length);
            });
            it('covers all tabs with download control tests', () => {
                const observedTabNames = $$('.tabAnchor')
                    .filter(a => a.isDisplayed())
                    .map(a => a.getText());
                assert.deepStrictEqual(
                    expectedTabNames,
                    observedTabNames,
                    'There appears to be a new tab on the page (observed names: [' +
                        observedTabNames.join(', ') +
                        '] expected names: [' +
                        expectedTabNames.join(', ') +
                        ']). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include' +
                        ' tests for this in hide-download-controls.spec.js.'
                );
            });
            describe('summary tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_summary').click();
                    $('[data-test=LazyMobXTable]').waitForExist();
                    globalCheck();
                });
            });
            describe('pathways tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_pathways').click();
                    $('.pathwayMapper').waitForExist();
                    globalCheck();
                });
            });
            describe('clinical data tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_clinicalData').click();
                    $('[data-test=LazyMobXTable]').waitForExist();
                    globalCheck();
                });
            });
            describe('files and links tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_filesAndLinks').click();
                    $('[data-test=LazyMobXTable]').waitForExist();
                    globalCheck();
                });
            });
            describe('tissue image tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_tissueImage').click();
                    $('iframe').waitForExist();
                    globalCheck();
                });
            });
            describe('pathology slide tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_openResource_PATHOLOGY_SLIDE').click();
                    $('h2').waitForExist();
                    globalCheck();
                });
            });
            describe('study sponsors tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_openResource_STUDY_SPONSORS').click();
                    $('h2').waitForExist();
                    globalCheck();
                });
            });
        });

        describe('study view', () => {
            const expectedTabNames = [
                'Summary',
                'Clinical Data',
                'CN Segments',
                'Files & Links',
                'Study Sponsors',
            ];
            before(() => {
                openAndSetProperty(
                    `${CBIOPORTAL_URL}/study/summary?id=study_es_0`,
                    { skin_hide_download_controls: true }
                );
                waitForStudyView();
                waitForTabs(expectedTabNames.length);
            });
            describe('summary tab', () => {
                it('covers all tabs with download control tests', () => {
                    const observedTabNames = $$('.tabAnchor')
                        .filter(a => a.isDisplayed())
                        .map(a => a.getText());
                    assert.deepStrictEqual(
                        expectedTabNames,
                        observedTabNames,
                        'There appears to be a new tab on the page (observed names: [' +
                            observedTabNames.join(', ') +
                            '] expected names: [' +
                            expectedTabNames.join(', ') +
                            ']). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include' +
                            ' tests for this in hide-download-controls.spec.js.'
                    );
                });
                it('global check for icon and occurrence of "Download" as a word', () => {
                    globalCheck();
                });
                it('does not show download option in chart menu-s', () => {
                    studyViewChartHoverHamburgerIcon(
                        'chart-container-SAMPLE_COUNT',
                        1000
                    );
                    globalCheck();
                    studyViewChartHoverHamburgerIcon(
                        'chart-container-study_es_0_mutations',
                        1000
                    );
                    globalCheck();
                    studyViewChartHoverHamburgerIcon(
                        'chart-container-MUTATION_COUNT',
                        1000
                    );
                    globalCheck();
                    studyViewChartHoverHamburgerIcon(
                        'chart-container-GENOMIC_PROFILES_SAMPLE_COUNT',
                        1000
                    );
                    globalCheck();
                    studyViewChartHoverHamburgerIcon(
                        'chart-container-FRACTION_GENOME_ALTERED',
                        1000
                    );
                    globalCheck();
                    studyViewChartHoverHamburgerIcon(
                        'chart-container-OS_SURVIVAL',
                        1000
                    );
                    globalCheck();
                });
            });
            describe('clinical data tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_clinicalData').click();
                    $('[data-test=LazyMobXTable]').waitForExist();
                    globalCheck();
                });
            });
            describe('CN segments tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_cnSegments').click();
                    $('.igvContainer').waitForExist(30000);
                    globalCheck();
                });
            });
            describe('files and links tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_filesAndLinks').click();
                    $('.resourcesSection').waitForExist();
                    globalCheck();
                });
            });
            describe('study sponsors tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_openResource_STUDY_SPONSORS').click();
                    $('h2').waitForExist();
                    globalCheck();
                });
            });
        });

        describe('group comparison', () => {
            const expectedTabNames = [
                'Overlap',
                'Survival',
                'Clinical',
                'Genomic Alterations',
                'mRNA',
                'DNA Methylation',
                'Treatment Response',
                'Mutational Signature',
                'Generic Assay Patient Test',
            ];
            before(() => {
                openAndSetProperty(browser.getUrl(), {
                    skin_hide_download_controls: false,
                });
                openGroupComparison(
                    `${CBIOPORTAL_URL}/study/summary?id=study_es_0`,
                    'chart-container-OS_STATUS',
                    true,
                    30000
                );
                openAndSetProperty(browser.getUrl(), {
                    skin_hide_download_controls: true,
                });
                waitForTabs(expectedTabNames.length);
            });
            it('covers all tabs with download control tests', () => {
                const observedTabNames = $$('.tabAnchor')
                    .filter(a => a.isDisplayed())
                    .map(a => a.getText());
                assert.deepStrictEqual(
                    expectedTabNames,
                    observedTabNames,
                    'There appears to be a new tab on the page (observed names: [' +
                        observedTabNames.join(', ') +
                        '] expected names: [' +
                        expectedTabNames.join(', ') +
                        ']). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include' +
                        ' tests for this in hide-download-controls.spec.js.'
                );
            });
            describe('overlap tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('[data-test=ComparisonPageOverlapTabDiv]').waitForExist();
                    globalCheck();
                });
            });
            describe('survival tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_survival').click();
                    $(
                        '[data-test=ComparisonPageSurvivalTabDiv]'
                    ).waitForExist();
                    globalCheck();
                });
            });
            describe('clinical tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_clinical').click();
                    $('[data-test=ClinicalTabPlotDiv]').waitForExist();
                    globalCheck();
                });
            });
            describe('genomic alterations tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_alterations').click();
                    $('[data-test=GeneBarPlotDiv]').waitForExist();
                    globalCheck();
                });
            });
            describe('mRNA tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_mrna').click();
                    $(
                        '[data-test=GroupComparisonMRNAEnrichments]'
                    ).waitForExist();
                    $$(
                        '[data-test=GroupComparisonMRNAEnrichments] tbody tr b'
                    )[0].click();
                    $('[data-test=MiniBoxPlot]').waitForExist();
                    globalCheck();
                });
            });
            describe('DNA methylation tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_dna_methylation').click();
                    $(
                        '[data-test=GroupComparisonMethylationEnrichments]'
                    ).waitForExist();
                    $$(
                        '[data-test=GroupComparisonMethylationEnrichments] tbody tr b'
                    )[0].click();
                    $('[data-test=MiniBoxPlot]').waitForExist();
                    globalCheck();
                });
            });
            describe('treatment response tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_generic_assay_treatment_response').click();
                    $('[data-test=LazyMobXTable]').waitForExist();
                    $(
                        '[data-test=GroupComparisonGenericAssayEnrichments]'
                    ).waitForExist();
                    $$(
                        '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b'
                    )[0].click();
                    $('[data-test=MiniBoxPlot]').waitForExist();
                    globalCheck();
                });
            });
            describe('mutational signature tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $('.tabAnchor_generic_assay_mutational_signature').click();
                    $(
                        '[data-test=GroupComparisonGenericAssayEnrichments]'
                    ).waitForExist();
                    $$(
                        '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b'
                    )[5].click(); // first 5 rows is invisible treatment responses
                    $('[data-test=MiniBoxPlot]').waitForExist();
                    globalCheck();
                });
            });
            // Activation of the 'Patient Test' tab results in a backend error. Omitting for now.
            // Inactivation of download tabs is also covered by other Generic Assay tabs.
            describe.omit('generic assay patient test tab', () => {
                it('global check for icon and occurrence of "Download" as a word', () => {
                    $(
                        '.tabAnchor_generic_assay_generic_assay_patient_test'
                    ).click();
                    $(
                        '[data-test=GroupComparisonGenericAssayEnrichments]'
                    ).waitForExist();
                    $$(
                        '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b'
                    )[5].click(); // first 5 rows is invisible treatment responses
                    $('[data-test=MiniBoxPlot]').waitForExist();
                    globalCheck();
                });
            });
        });
    }
});

const globalCheck = () => {
    assert(
        !$('*=Download').isExisting(),
        'The word "Download" occurs on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    );
    assert(
        !$('*=download').isExisting(),
        'The word "download" occurs on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    );
    assert(
        !$(downloadIcon).isExisting(),
        'A download button/icon is visible on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    );
    assert(
        !$(downloadCloudIcon).isExisting(),
        'A cloud download button/icon is visible on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    );
    assert(
        !$(clipboardIcon).isExisting(),
        'A download button/icon is visible on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    );
};

const openAndSetProperty = (url, prop) => {
    goToUrlAndSetLocalStorage(url, true);
    setServerConfiguration(prop);
    goToUrlAndSetLocalStorage(url, true);
};

const waitForTabs = count => {
    browser.waitUntil(() => {
        return $$('.tabAnchor').length >= count;
    }, 300000);
};

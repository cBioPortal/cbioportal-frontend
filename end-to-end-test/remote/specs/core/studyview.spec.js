const assert = require('assert');
const expect = require('chai').expect;
const waitForOncoprint = require('../../../shared/specUtils').waitForOncoprint;
const goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
const waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;
const assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
const toStudyViewSummaryTab = require('../../../shared/specUtils')
    .toStudyViewSummaryTab;
const toStudyViewClinicalDataTab = require('../../../shared/specUtils')
    .toStudyViewClinicalDataTab;
const removeAllStudyViewFilters = require('../../../shared/specUtils')
    .removeAllStudyViewFilters;
const getNumberOfStudyViewCharts = require('../../../shared/specUtils')
    .getNumberOfStudyViewCharts;
const getTextFromElement = require('../../../shared/specUtils')
    .getTextFromElement;
const waitForStudyViewSelectedInfo = require('../../../shared/specUtils')
    .waitForStudyViewSelectedInfo;
var waitForStudyView = require('../../../shared/specUtils').waitForStudyView;
const {
    setDropdownOpen,
    jsApiHover,
    setCheckboxChecked,
    getElementByTestHandle,
} = require('../../../shared/specUtils');

var {
    checkElementWithMouseDisabled,
    setInputText,
} = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const CUSTOM_SELECTION_BUTTON = "[data-test='custom-selection-button']";
const SELECTED_SAMPLES = "strong[data-test='selected-samples']";
const SELECTED_PATIENTS = "strong[data-test='selected-patients']";
const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const ADD_CHART_CLINICAL_TAB = '.addChartTabs a.tabAnchor_Clinical';
const ADD_CHART_GENOMIC_TAB = '.addChartTabs a.tabAnchor_Genomic';
const ADD_CHART_CUSTOM_DATA_TAB = '.addChartTabs a.tabAnchor_Custom_Data';
const ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON =
    "[data-test='CustomCaseSetSubmitButton']";
const ADD_CHART_GENERIC_ASSAY_TAB =
    '.addChartTabs a.tabAnchor_MICROBIOME_SIGNATURE';
const ADD_CHART_CUSTOM_GROUPS_TEXTAREA = "[data-test='CustomCaseSetInput']";
const STUDY_SUMMARY_RAW_DATA_DOWNLOAD =
    "[data-test='studySummaryRawDataDownloadIcon']";
const CNA_GENES_TABLE = "[data-test='copy number alterations-table']";
const CANCER_GENE_FILTER_ICON = "[data-test='header-filter-icon']";

const WAIT_FOR_VISIBLE_TIMEOUT = 30000;

const hide = ['.chartHeader .controls'];

describe('study laml_tcga tests', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga`;
        goToUrlAndSetLocalStorage(url);
    });
    it('study view laml_tcga', () => {
        $("[data-test='summary-tab-content']").waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        waitForNetworkQuiet();
        // screenshot seems to occasionally fail because of tooltip showing up
        // see "need-fixing" tests
        // const res = browser.checkElement('#mainColumn');
        // assertScreenShotMatch(res);
    });
    it('study view laml_tcga clinical data clicked', () => {
        $('.tabAnchor_clinicalData').click();
        $("[data-test='clinical-data-tab-content']").waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        waitForNetworkQuiet();
        const res = checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('study should have the raw data available', () => {
        assert($(STUDY_SUMMARY_RAW_DATA_DOWNLOAD).isExisting());
    });

    it('when quickly adding charts, each chart should get proper data.', function() {
        this.retries(0);

        toStudyViewSummaryTab();
        waitForStudyViewSelectedInfo();
        $(ADD_CHART_BUTTON).click();
        // Wait for the data frequency is calculated
        waitForNetworkQuiet();

        // Add three charts
        $("[data-test='add-chart-option-cancer-type'] input").click();
        $("[data-test='add-chart-option-case-lists'] input").click();

        // Pause a bit time to let the page render the charts
        waitForStudyView();
        const res = checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('when adding chart with categories more than the pie2Table threshold, the pie chart should be converted to table', () => {
        $("[data-test='fixed-header-table-search-input']").setValue(
            'Other Sample ID'
        );
        $(
            "[data-test='add-chart-option-other-sample-id'] input"
        ).waitForDisplayed({ timeout: WAIT_FOR_VISIBLE_TIMEOUT });

        // Pause a bit time to let the table render
        waitForStudyView();

        $("[data-test='add-chart-option-other-sample-id'] input").click();
        $(
            "[data-test='chart-container-OTHER_SAMPLE_ID'] .ReactVirtualized__Table"
        ).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        const res = browser.checkElement(
            "[data-test='chart-container-OTHER_SAMPLE_ID']"
        );
        assertScreenShotMatch(res);
    });

    it('custom Selection should trigger filtering the study, no chart should be added, custom selection tooltip should be closed', () => {
        $(CUSTOM_SELECTION_BUTTON).click();

        // Select button should be disabled
        assert(!$(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON).isEnabled());
        $(ADD_CHART_CUSTOM_GROUPS_TEXTAREA).waitForDisplayed();
        $(ADD_CHART_CUSTOM_GROUPS_TEXTAREA).setValue(
            'laml_tcga:TCGA-AB-2802-03\nlaml_tcga:TCGA-AB-2803-03\n'
        );
        $(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON).waitForEnabled();
        $(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON).click();

        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '2');
        assert(getTextFromElement(SELECTED_SAMPLES) === '2');

        // clear the filters
        $("[data-test='clear-all-filters']").waitForDisplayed();
        $("[data-test='clear-all-filters']").click();
    });

    describe('add chart', () => {
        it('the button text should be updated in different tab', () => {
            toStudyViewSummaryTab();
            assert(getTextFromElement(ADD_CHART_BUTTON) === 'Charts ▾');

            toStudyViewClinicalDataTab();
            assert(getTextFromElement(ADD_CHART_BUTTON) === 'Columns ▾');
        });
        it('chart in genomic tab can be updated', () => {
            toStudyViewSummaryTab();
            const numOfChartsBeforeAdding = getNumberOfStudyViewCharts();
            setDropdownOpen(true, ADD_CHART_BUTTON, ADD_CHART_GENOMIC_TAB);
            $(ADD_CHART_GENOMIC_TAB).click();

            const chosenCheckbox =
                '.addChartTabs .addGenomicChartTab .add-chart-option:nth-child(1) input';
            $(chosenCheckbox).waitForExist({ timeout: 10000 });

            const isSelected = $(chosenCheckbox).isSelected();

            $(chosenCheckbox).click();
            assert(
                numOfChartsBeforeAdding ===
                    getNumberOfStudyViewCharts() + (isSelected ? 1 : -1)
            );
        });
        it('chart in clinical tab can be updated', () => {
            const numOfChartsBeforeAdding = getNumberOfStudyViewCharts();

            if (!$(ADD_CHART_CLINICAL_TAB).isDisplayed()) {
                $(ADD_CHART_BUTTON).click();
            }
            $(ADD_CHART_CLINICAL_TAB).click();

            const chosenCheckbox = $('.addChartTabs .add-chart-option input');
            const isSelected = chosenCheckbox.isSelected();

            chosenCheckbox.click();
            assert(
                numOfChartsBeforeAdding ===
                    getNumberOfStudyViewCharts() + (isSelected ? 1 : -1)
            );
        });
        describe('add custom data', () => {
            before(() => {
                if (!$(ADD_CHART_CUSTOM_DATA_TAB).isDisplayed()) {
                    $(ADD_CHART_BUTTON).waitForExist();
                    $(ADD_CHART_BUTTON).click();
                }
                $(ADD_CHART_CUSTOM_DATA_TAB).waitForExist();
                $(ADD_CHART_CUSTOM_DATA_TAB).click();
            });
            it('add chart button should be disabled when no content in the textarea', () => {
                assert(
                    !$(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON).isEnabled()
                );
            });
            it('add chart button should be disabled when content is invalid', () => {
                $(ADD_CHART_CUSTOM_GROUPS_TEXTAREA).setValue('test');
                // pause to wait for the content validation
                $('[data-test=ValidationResultWarning]').waitForDisplayed();
                assert(
                    !$(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON).isEnabled()
                );
            });
            it('add chart button should be enabled when content is valid', () => {
                $(ADD_CHART_CUSTOM_GROUPS_TEXTAREA).setValue(
                    'laml_tcga:TCGA-AB-2802-03'
                );
                // pause to wait for the content validation (remove the error message from the previous test)
                $('[data-test=ValidationResultWarning]').waitForDisplayed({
                    reverse: true,
                });
                assert($(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON).isEnabled());
            });
            //Skipping it for now since this feature is dependent on session-service and
            // heroku instance of it not stable (would not be active/running all the time)
            // also data-test would be dynamic and depends on chart id (session id)
            it('a new chart should be added and filtered', () => {
                $(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON).waitForEnabled();
                const beforeClick = getNumberOfStudyViewCharts();
                $(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON).click();

                $('.chartTitle*=Custom Data 1').waitForDisplayed();

                // it should not impact any other charts
                assert(beforeClick + 1 === getNumberOfStudyViewCharts());

                assert(
                    $('.userSelections')
                        .$('span=Custom Data 1')
                        .isExisting(),
                    'new chart filter state is reflected in filter breadcrumb'
                );
            });
            after(() => {
                // Close the tooltip
                if ($(ADD_CHART_CUSTOM_DATA_TAB).isDisplayed()) {
                    $(ADD_CHART_BUTTON).click();
                }
            });
        });
    });
});

describe('add chart should not be shown in other irrelevant tabs', () => {
    it('check add chart button doesnt exist on heatmap', () => {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/study?id=brca_tcga_pub`);
        waitForNetworkQuiet(30000);

        $('#studyViewTabs a.tabAnchor_clinicalData').waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });

        assert($('button=Charts ▾').isExisting());

        $('#studyViewTabs a.tabAnchor_clinicalData').click();
        assert(!$('button=Charts ▾').isExisting());
    });
});

describe('check the filters are working properly', () => {
    before(function() {
        const url = `${CBIOPORTAL_URL}/study/summary?id=laml_tcga#filterJson=%7B%22genomicDataFilters%22%3A%5B%7B%22hugoGeneSymbol%22%3A%22NPM1%22%2C%22profileType%22%3A%22rna_seq_v2_mrna_median_Zscores%22%2C%22values%22%3A%5B%7B%22start%22%3A0%2C%22end%22%3A0.25%7D%2C%7B%22start%22%3A0.25%2C%22end%22%3A0.5%7D%2C%7B%22start%22%3A0.5%2C%22end%22%3A0.75%7D%5D%7D%5D%2C%22clinicalDataFilters%22%3A%5B%7B%22attributeId%22%3A%22SEX%22%2C%22values%22%3A%5B%7B%22value%22%3A%22Female%22%7D%5D%7D%2C%7B%22attributeId%22%3A%22AGE%22%2C%22values%22%3A%5B%7B%22end%22%3A35%2C%22start%22%3A30%7D%2C%7B%22end%22%3A40%2C%22start%22%3A35%7D%2C%7B%22end%22%3A45%2C%22start%22%3A40%7D%2C%7B%22end%22%3A50%2C%22start%22%3A45%7D%2C%7B%22end%22%3A55%2C%22start%22%3A50%7D%2C%7B%22end%22%3A60%2C%22start%22%3A55%7D%2C%7B%22end%22%3A65%2C%22start%22%3A60%7D%5D%7D%5D%2C%22geneFilters%22%3A%5B%7B%22molecularProfileIds%22%3A%5B%22laml_tcga_mutations%22%5D%2C%22geneQueries%22%3A%5B%5B%22NPM1%22%2C%22FLT3%22%5D%5D%7D%2C%7B%22molecularProfileIds%22%3A%5B%22laml_tcga_gistic%22%5D%2C%22geneQueries%22%3A%5B%5B%22FUS%3AHOMDEL%22%2C%22KMT2A%3AAMP%22%5D%5D%7D%5D%2C%22genomicProfiles%22%3A%5B%5B%22gistic%22%5D%2C%5B%22mutations%22%5D%5D%7D`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet(60000);
    });
    it('filter study from url', function() {
        waitForNetworkQuiet(60000);
        const res = checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('removing filters are working properly', function() {
        // Remove pie chart filter
        $("[data-test='pill-tag-delete']").click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '1');
        assert(getTextFromElement(SELECTED_SAMPLES) === '1');

        // Remove bar chart filter
        $("[data-test='pill-tag-delete']").click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '1');
        assert(getTextFromElement(SELECTED_SAMPLES) === '1');

        // Remove gene specific chart filter
        $("[data-test='pill-tag-delete']").click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '5');
        assert(getTextFromElement(SELECTED_SAMPLES) === '5');

        // Remove mutated genes filter
        $("[data-test='pill-tag-delete']").click();
        waitForStudyViewSelectedInfo();
        $("[data-test='pill-tag-delete']").click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '13');
        assert(getTextFromElement(SELECTED_SAMPLES) === '13');

        // Remove cna genes filter
        $("[data-test='pill-tag-delete']").click();
        waitForStudyViewSelectedInfo();
        $("[data-test='pill-tag-delete']").click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '188');
        assert(getTextFromElement(SELECTED_SAMPLES) === '188');

        // Remove genomic profiles sample count filter
        $("[data-test='pill-tag-delete']").click();
        waitForStudyViewSelectedInfo();
        $("[data-test='pill-tag-delete']").click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '200');
        assert(getTextFromElement(SELECTED_SAMPLES) === '200');
    });
});

// This needs to be done separately due to leak of data in the other tests
describe('check the fusion filter is working properly', () => {
    before(function() {
        const url = `${CBIOPORTAL_URL}/study/summary?id=es_dfarber_broad_2014&filters=%7B%22geneFilters%22%3A%5B%7B%22molecularProfileIds%22%3A%5B%22es_dfarber_broad_2014_structural_variants%22%5D%2C%22geneQueries%22%3A%5B%5B%22FLI1%22%5D%5D%7D%5D%7D`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet(60000);
    });
    it('fusion filter filter study from url', function() {
        waitForStudyViewSelectedInfo();
        const res = checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('fusion filter removing filters are working properly', function() {
        // Remove cna genes filter
        $("[data-test='pill-tag-delete']").click();
        waitForStudyViewSelectedInfo();
        assert(getTextFromElement(SELECTED_PATIENTS) === '103');
        assert(getTextFromElement(SELECTED_SAMPLES) === '107');
    });
});

describe('cancer gene filter', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga`;
        goToUrlAndSetLocalStorage(url);
    });

    it('the cancer gene filter should be, by default, disabled', () => {
        $(
            `${CNA_GENES_TABLE} [data-test='gene-column-header']`
        ).waitForDisplayed({ timeout: WAIT_FOR_VISIBLE_TIMEOUT });
        assert.equal(
            $(`${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`).isExisting(),
            true
        );
        assert.equal(
            $(`${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`).getCSSProperty(
                'color'
            ).parsed.hex,
            '#bebebe'
        );
    });

    it('non cancer gene should show up when the cancer gene filter is disabled', () => {
        assertScreenShotMatch(checkElementWithMouseDisabled(CNA_GENES_TABLE));
    });

    it('the cancer gene filter should remove non cancer gene', () => {
        // enable the filter and check
        $(`${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`).click();
        assert.equal(
            $(`${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`).getCSSProperty(
                'color'
            ).parsed.hex,
            '#000000'
        );
        assertScreenShotMatch(checkElementWithMouseDisabled(CNA_GENES_TABLE));
    });
});

describe('crc_msk_2017 study tests', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=crc_msk_2017`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet();
    });
    it('the MSI score should use the custom bins, then the MSI score column should be added in the clinical data tab', () => {
        $(ADD_CHART_BUTTON).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        browser.waitUntil(
            () =>
                !$(ADD_CHART_BUTTON)
                    .getAttribute('class')
                    .includes('disabled'),
            { timeout: WAIT_FOR_VISIBLE_TIMEOUT }
        );
        setDropdownOpen(
            true,
            ADD_CHART_BUTTON,
            "[data-test='fixed-header-table-search-input']"
        );

        // Wait after the frequency is calculated.
        waitForNetworkQuiet();

        const msiScoreRow = "[data-test='add-chart-option-msi-score']";
        $("[data-test='fixed-header-table-search-input']").setValue('msi');
        $(msiScoreRow).waitForDisplayed();

        $(msiScoreRow + ' input').waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(msiScoreRow + ' input').click();
        // Close the tooltip

        $(ADD_CHART_BUTTON).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        $(ADD_CHART_BUTTON).click();

        $("[data-test='chart-container-MSI_SCORE'] svg").waitForExist({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });

        const res = checkElementWithMouseDisabled(
            "[data-test='chart-container-MSI_SCORE'] svg"
        );
        assertScreenShotMatch(res);

        toStudyViewClinicalDataTab();
        $("[data-test='clinical-data-tab-content'] table").waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        assert($("span[data-test='MSI Score']").isExisting());
    });
});

describe('study view lgg_tcga study tests', () => {
    const pieChart = "[data-test='chart-container-SEX']";
    const table = "[data-test='chart-container-CANCER_TYPE_DETAILED']";
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_tcga`;
        goToUrlAndSetLocalStorage(url);
        toStudyViewSummaryTab();
        waitForNetworkQuiet();
    });
    describe('bar chart', () => {
        const barChart = "[data-test='chart-container-DAYS_TO_COLLECTION']";
        it('the log scale should be used for Sample Collection', () => {
            $(barChart).waitForDisplayed({ timeout: WAIT_FOR_VISIBLE_TIMEOUT });
            $(barChart).scrollIntoView();
            jsApiHover(barChart);
            $(barChart + ' .controls').waitForExist({ timeout: 10000 });

            // move to hamburger icon
            jsApiHover("[data-test='chart-header-hamburger-icon']");

            // wait for the menu available
            $(
                "[data-test='chart-header-hamburger-icon-menu']"
            ).waitForDisplayed({ timeout: WAIT_FOR_VISIBLE_TIMEOUT });

            assert(
                $(
                    barChart + ' .chartHeader .logScaleCheckbox input'
                ).isSelected()
            );
        });
    });
    describe('pie chart', () => {
        describe('chart controls', () => {
            it('the table icon should be available', () => {
                $(pieChart).waitForDisplayed({
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
                jsApiHover(pieChart);

                browser.waitUntil(() => {
                    return $(pieChart + ' .controls').isExisting();
                }, 10000);
                assert($(pieChart + ' .controls .fa-table').isExisting());
            });
        });
    });
    describe('table', () => {
        describe('chart controls', () => {
            it('the pie icon should be available', () => {
                $(table).waitForDisplayed({
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
                jsApiHover(table);

                browser.waitUntil(() => {
                    return $(table + ' .controls').isExisting();
                }, 10000);
                assert($(table + ' .controls .fa-pie-chart').isExisting());
            });

            it('table should be sorted by Freq in the default setting', () => {
                // we need to move to the top of the page, otherwise the offset of add chart button is calculated wrong
                $('body').moveTo({ xOffset: 0, yOffset: 0 });
                // Open the 'Add clinical chart' menu
                setDropdownOpen(true, ADD_CHART_BUTTON, ADD_CHART_CLINICAL_TAB);
                $(ADD_CHART_CLINICAL_TAB).click();

                const option =
                    "[data-test='add-chart-option-cancer-type-detailed'] input";

                $("[data-test='fixed-header-table-search-input']").setValue(
                    'cancer type detailed'
                );
                $(option).waitForDisplayed({
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
                // Remove and add the table back to reset the table to prevent any side effects created in other tests
                setCheckboxChecked(false, option);
                browser.pause();
                // Make sure the studies dropdown is still open
                setDropdownOpen(true, ADD_CHART_BUTTON, ADD_CHART_CLINICAL_TAB);
                $(option).waitForDisplayed({
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
                setCheckboxChecked(true, option);

                // Close the 'Add chart' menu
                setDropdownOpen(
                    false,
                    ADD_CHART_BUTTON,
                    ADD_CHART_CLINICAL_TAB
                );

                const res = checkElementWithMouseDisabled(table);
                assertScreenShotMatch(res);
            });
        });
    });
});

describe('study view tcga pancancer atlas tests', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga_pan_can_atlas_2018%2Cacc_tcga_pan_can_atlas_2018%2Cblca_tcga_pan_can_atlas_2018%2Clgg_tcga_pan_can_atlas_2018%2Cbrca_tcga_pan_can_atlas_2018%2Ccesc_tcga_pan_can_atlas_2018%2Cchol_tcga_pan_can_atlas_2018%2Ccoadread_tcga_pan_can_atlas_2018%2Cdlbc_tcga_pan_can_atlas_2018%2Cesca_tcga_pan_can_atlas_2018%2Cgbm_tcga_pan_can_atlas_2018%2Chnsc_tcga_pan_can_atlas_2018%2Ckich_tcga_pan_can_atlas_2018%2Ckirc_tcga_pan_can_atlas_2018%2Ckirp_tcga_pan_can_atlas_2018%2Clihc_tcga_pan_can_atlas_2018%2Cluad_tcga_pan_can_atlas_2018%2Clusc_tcga_pan_can_atlas_2018%2Cmeso_tcga_pan_can_atlas_2018%2Cov_tcga_pan_can_atlas_2018%2Cpaad_tcga_pan_can_atlas_2018%2Cpcpg_tcga_pan_can_atlas_2018%2Cprad_tcga_pan_can_atlas_2018%2Csarc_tcga_pan_can_atlas_2018%2Cskcm_tcga_pan_can_atlas_2018%2Cstad_tcga_pan_can_atlas_2018%2Ctgct_tcga_pan_can_atlas_2018%2Cthym_tcga_pan_can_atlas_2018%2Cthca_tcga_pan_can_atlas_2018%2Cucs_tcga_pan_can_atlas_2018%2Cucec_tcga_pan_can_atlas_2018%2Cuvm_tcga_pan_can_atlas_2018`;
        goToUrlAndSetLocalStorage(url);
        toStudyViewSummaryTab();
        waitForNetworkQuiet(30000);
    });
    it('tcga pancancer atlas page', () => {
        assertScreenShotMatch(checkElementWithMouseDisabled('#mainColumn'));
    });
});

describe('virtual study', () => {
    it('loads a virtual study', () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=5dd408f0e4b0f7d2de7862a8`;
        goToUrlAndSetLocalStorage(url);
        waitForStudyView();
        assertScreenShotMatch(checkElementWithMouseDisabled('#mainColumn'));
    });
});

describe('multi studies', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=acc_tcga,lgg_tcga`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet();
    });

    it('check for survival plots', () => {
        assertScreenShotMatch(checkElementWithMouseDisabled('#mainColumn'));
    });

    it('multi studies view should not have the raw data available', () => {
        assert(!$(STUDY_SUMMARY_RAW_DATA_DOWNLOAD).isExisting());
    });
});

describe('check the simple filter(filterAttributeId, filterValues) is working properly', () => {
    it('A error message should be shown when the filterAttributeId is not available for the study', () => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_tcga&filterAttributeId=ONCOTREE_CODE_TEST&filterValues=OAST`;
        goToUrlAndSetLocalStorage(url);
        waitForNetworkQuiet();
        $('body').moveTo({ xOffset: 0, yOffset: 0 });

        const res = checkElementWithMouseDisabled(
            "[data-test='study-view-header']"
        );
        assertScreenShotMatch(res);
    });
    it('Check if case insensitivity in filter works', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study?id=lgg_tcga&filterAttributeId=SEX&filterValues=MALE`
        );
        waitForNetworkQuiet();
        waitForStudyViewSelectedInfo();
        const sampleCount1 = getTextFromElement(SELECTED_PATIENTS);

        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study?id=lgg_tcga&filterAttributeId=SEX&filterValues=Male`
        );
        waitForNetworkQuiet();
        waitForStudyViewSelectedInfo();
        const sampleCount2 = getTextFromElement(SELECTED_PATIENTS);
        assert(sampleCount1 === sampleCount2);
    });
});

describe('the gene panel is loaded properly', () => {
    before(() => {
        const url = `${CBIOPORTAL_URL}/study?id=msk_impact_2017`;
        goToUrlAndSetLocalStorage(url);
    });
    it('check the mutated genes table has gene panel info', () => {
        const tooltipSelector = '[data-test="freq-cell-tooltip"]';
        $(`${CNA_GENES_TABLE} [data-test='freq-cell']`).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });

        $(`${CNA_GENES_TABLE} [data-test='freq-cell']:first-child`).moveTo();

        $(tooltipSelector).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });

        // the gene panel ID IMPACT341 should be listed
        $(tooltipSelector)
            .getText()
            .includes('IMPACT341');

        $(
            `${tooltipSelector} a[data-test='gene-panel-linkout-IMPACT341']`
        ).click();

        // the modal title should show gene panel ID
        $(`[data-test="gene-panel-modal-title"]`).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        assert.equal(
            $(`[data-test="gene-panel-modal-title"]`).getText(),
            'IMPACT341'
        );

        // test whether the gene info has been loaded correctly
        $(`[data-test="gene-panel-modal-body"]`).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        assert.equal(
            $('[data-test="gene-panel-modal-body"] p:first-child').getText(),
            'ABL1'
        );
    });
});

describe('submit genes to results view query', () => {
    it('gives a submit error if protein oql is inputted and no protein profile is available for the study', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study/summary?id=brca_mskcc_2019`
        );
        $('[data-test="geneSet"]').waitForExist({ timeout: 5000 });
        setInputText('[data-test="geneSet"]', 'PTEN: PROT>0');

        // error appears
        browser.waitUntil(() => {
            return (
                $('[data-test="oqlErrorMessage"]').isExisting() &&
                $('[data-test="oqlErrorMessage"]').getText() ===
                    'Protein level data query specified in OQL, but no protein level profile is available in the selected study.'
            );
        }, 20000);

        // submit is disabled
        browser.waitUntil(() => {
            return !$('button[data-test="geneSetSubmit"]').isEnabled();
        }, 5000);
    });
    it('auto-selects an mrna profile when mrna oql is entered', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study/summary?id=acc_tcga_pan_can_atlas_2018`
        );
        const studyViewTabId = browser.getWindowHandles()[0];

        // enter oql
        $('textarea[data-test="geneSet"]').waitForExist({ timeout: 10000 });
        setInputText('textarea[data-test="geneSet"]', 'PTEN: EXP>1');

        $('button[data-test="geneSetSubmit"]').waitForEnabled({
            timeout: 10000,
        });
        $('button[data-test="geneSetSubmit"]').click();

        browser.waitUntil(() => browser.getWindowHandles().length > 1); // wait until new tab opens

        // switch tabs to results view
        const resultsViewTabId = browser
            .getWindowHandles()
            .find(x => x !== studyViewTabId);
        browser.switchToWindow(resultsViewTabId);

        // wait for query to load
        waitForOncoprint(20000);

        // only mrna profile is there
        const profileFilter = (
            browser.execute(function() {
                return { ...urlWrapper.query };
            }).profileFilter || ''
        ).split(',');
        assert.equal(profileFilter.includes('mutations'), false);
        assert.equal(profileFilter.includes('gistic'), false);
        assert.equal(
            profileFilter.includes('rna_seq_v2_mrna_median_Zscores'),
            true
        );
    });

    describe('chol_tcga_pan_can_atlas_2018 study generic assay tests', () => {
        before(() => {
            const url = `${CBIOPORTAL_URL}/study?id=chol_tcga_pan_can_atlas_2018`;
            goToUrlAndSetLocalStorage(url);
            waitForNetworkQuiet();
        });
        it('generic assay chart should be added in the summary tab', function() {
            this.retries(0);
            browser.waitUntil(
                () =>
                    !$(ADD_CHART_BUTTON)
                        .getAttribute('class')
                        .includes('disabled'),
                { timeout: 60000 }
            );
            $(ADD_CHART_BUTTON).click();

            // Change to GENERIC ASSAY tab
            $(ADD_CHART_GENERIC_ASSAY_TAB).waitForDisplayed({
                timeout: WAIT_FOR_VISIBLE_TIMEOUT,
            });
            $(ADD_CHART_GENERIC_ASSAY_TAB).click();

            // wait for generic assay data loading complete
            // and select a option
            $(
                'div[data-test="GenericAssayEntitySelection"] #react-select-3-input'
            ).waitForExist();
            $(
                'div[data-test="GenericAssayEntitySelection"] #react-select-3-input'
            ).setValue('Prasinovirus');

            $('div=Select all filtered options (1)').click();
            // close the dropdown
            var indicators = $$('div[class$="indicatorContainer"]');
            indicators[0].click();
            var selectedOptions = $$('div[class$="multiValue"]');
            assert.equal(selectedOptions.length, 1);

            // this is necessary to get the options selection to "take"
            $(ADD_CHART_GENERIC_ASSAY_TAB).click();

            $('button=Add Chart').click();
            // Wait for chart to be added
            waitForNetworkQuiet();

            const res = checkElementWithMouseDisabled('#mainColumn');
            assertScreenShotMatch(res);
        });
    });
});

describe('study view treatments table', () => {
    it('loads multiple studies with treatments tables', function() {
        var url = `${CBIOPORTAL_URL}/study/summary?id=gbm_columbia_2019%2Clgg_ucsf_2014`;
        goToUrlAndSetLocalStorage(url);
        $('[data-test="PATIENT_TREATMENTS-table"]').waitForExist();
        $('[data-test="SAMPLE_TREATMENTS-table"]').waitForExist();

        const res = checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('can filter a study by sample treatments', function() {
        const sampleTreatmentsFirstCheckbox =
            '[data-test="SAMPLE_TREATMENTS-table"] .ReactVirtualized__Table__row:nth-child(1) input';
        const sampleTreatmentsSelectSamplesButton =
            '[data-test="SAMPLE_TREATMENTS-table"] button';
        var url = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014`;
        goToUrlAndSetLocalStorage(url);

        $(sampleTreatmentsFirstCheckbox).waitForExist();
        $(sampleTreatmentsFirstCheckbox).click();
        $(sampleTreatmentsSelectSamplesButton).waitForExist();
        $(sampleTreatmentsSelectSamplesButton).click();
        waitForNetworkQuiet();

        const res = checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('can filter a study by patient treatments', function() {
        var url = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014`;
        goToUrlAndSetLocalStorage(url);

        const patientTreatmentsFirstCheckbox =
            '[data-test="PATIENT_TREATMENTS-table"] .ReactVirtualized__Table__row:nth-child(1) input';
        const patientTreatmentsSelectSamplesButton =
            '[data-test="PATIENT_TREATMENTS-table"] button';

        $(patientTreatmentsFirstCheckbox).waitForExist();
        $(patientTreatmentsFirstCheckbox).click();
        $(patientTreatmentsSelectSamplesButton).waitForExist();
        $(patientTreatmentsSelectSamplesButton).click();
        waitForNetworkQuiet();

        const res = checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });
});

describe('study view timeline events availability table', () => {
    it('verify timeline events availability table is visible', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study/summary?id=cesc_tcga_pan_can_atlas_2018`
        );
        getElementByTestHandle('CLINICAL_EVENT_TYPE_COUNT-table').waitForExist({
            timeout: 20000,
        });
    });

    it('verify filters can be applied', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study/summary?id=cesc_tcga_pan_can_atlas_2018`
        );

        getElementByTestHandle('CLINICAL_EVENT_TYPE_COUNT-table').waitForExist({
            timeout: 20000,
        });
        const selectedPatients = getElementByTestHandle(
            'selected-patients'
        ).getText();

        const timelineEventsAvailabilityCheckBox =
            '[data-test="CLINICAL_EVENT_TYPE_COUNT-table"] .ReactVirtualized__Table__row:nth-child(2) input';

        const applyFilterButton =
            '[data-test="CLINICAL_EVENT_TYPE_COUNT-table"] button';

        $(timelineEventsAvailabilityCheckBox).waitForExist();
        $(timelineEventsAvailabilityCheckBox).click();
        $(applyFilterButton).waitForExist();
        $(applyFilterButton).click();
        waitForNetworkQuiet();
        assert.notEqual(
            getElementByTestHandle('selected-patients').getText(),
            selectedPatients
        );
    });
});

describe('study view mutations table', () => {
    // this guards against server-side regression
    // in which frequencies are miscalculated for
    // with mutations which are called but not profile
    it('shows mutation frequencies correctly for called but unprofiled mutations', () => {
        var url = `${CBIOPORTAL_URL}/study/summary?id=msk_impact_2017`;
        goToUrlAndSetLocalStorage(url);

        const res = checkElementWithMouseDisabled(
            "[data-test='chart-container-msk_impact_2017_mutations']"
        );
        assertScreenShotMatch(res);
    });
});

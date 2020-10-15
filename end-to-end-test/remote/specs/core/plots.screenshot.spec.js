var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var checkElementWithElementHidden = require('../../../shared/specUtils')
    .checkElementWithElementHidden;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

function waitForAndCheckPlotsTab() {
    browser.moveToObject('body', 0, 0);
    browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]', 20000);
    var res = checkElementWithElementHidden(
        'div[data-test="PlotsTabEntireDiv"]',
        '.popover',
        { hide: ['.qtip'] }
    );
    assertScreenShotMatch(res);
}

describe('plots tab screenshot tests', function() {
    it('plots tab mutation type view', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2&Z_SCORE_THRESHOLD=2&cancer_study_id=brca_tcga&case_set_id=brca_tcga_cnaseq&data_priority=0&gene_list=TP53%20MDM2&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_mutations&plots_vert_selection=%7B"selectedDataSourceOption"%3A"rna_seq_v2_mrna_median_Zscores"%7D&tab_index=tab_visualize`
        );
        waitForAndCheckPlotsTab();
    });
    it('plots tab molecular vs molecular same gene', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2&Z_SCORE_THRESHOLD=2&cancer_study_id=brca_tcga&case_set_id=brca_tcga_cnaseq&data_priority=0&gene_list=TP53%20MDM2&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_mutations&plots_horz_selection=%7B"dataType"%3A"MRNA_EXPRESSION"%2C"selectedDataSourceOption"%3A"mrna"%7D&plots_vert_selection=%7B"selectedDataSourceOption"%3A"rna_seq_v2_mrna_median_Zscores"%7D&tab_index=tab_visualize`
        );
        browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]', 20000);
        browser.waitForExist('input[data-test="ViewCopyNumber"]');
        browser.click('input[data-test="ViewCopyNumber"]');
        waitForAndCheckPlotsTab();
    });
    it('plots tab molecular vs molecular same gene changed gene', function() {
        browser.execute(function() {
            resultsViewPlotsTab.test__selectGeneOption(false, 4193);
        });
        browser.waitForExist('input[data-test="ShowRegressionline"]', 10000);
        browser.click('input[data-test="ShowRegressionline"]');
        waitForAndCheckPlotsTab();
    });
    it('plots tab copy number view', function() {
        browser.click('input[data-test="ShowRegressionline"]');
        browser.click('input[data-test="ViewCopyNumber"]');
        waitForAndCheckPlotsTab();
    });
    it('plots tab molecular vs molecular different genes', function() {
        browser.execute(function() {
            resultsViewPlotsTab.test__selectGeneOption(true, 7157);
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab molecular vs molecular different genes different profiles', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'rna_seq_v2_mrna',
            });
        });
        browser.waitForExist('input[data-test="ShowRegressionline"]', 3000);
        browser.click('input[data-test="ShowRegressionline"]');
        waitForAndCheckPlotsTab();
    });
    it('plots tab molecular vs molecular swapped axes', function() {
        browser.click('input[data-test="ShowRegressionline"]');
        browser.click('[data-test="swapHorzVertButton"]');
        waitForAndCheckPlotsTab();
    });
    it('plots tab search case id', function() {
        browser.click('input[data-test="ViewMutationType"]');
        browser.execute(function() {
            resultsViewPlotsTab.executeSearchCase('TCGA-E2 TCGA-A8-A08G');
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab search case id and mutation', function() {
        browser.execute(function() {
            resultsViewPlotsTab.executeSearchMutation(
                'L321 V2L apsdoifjapsoid'
            );
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab search mutation', function() {
        browser.execute(function() {
            resultsViewPlotsTab.executeSearchCase('');
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab log scale off', function() {
        browser.click('input[data-test="VerticalLogCheckbox"]');
        waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs molecular', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'clinical_attribute',
            });
        });
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'AGE',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs molecular boxplot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab molecular vs clinical boxplot, mutation search off', function() {
        browser.execute(function() {
            resultsViewPlotsTab.executeSearchMutation('');
        });
        browser.click('[data-test="swapHorzVertButton"]');
        waitForAndCheckPlotsTab();
    });
    it('plots tab mutations vs clinical boxplot', function() {
        browser.click('[data-test="swapHorzVertButton"]');
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'AGE',
            });
        });
        browser.click('[data-test="swapHorzVertButton"]');
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'MUTATION_EXTENDED',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab mutations wild type mode vs clinical boxplot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisMutationCountBySelect({
                value: 'MutatedVsWildType',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical boxplot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'clinical_attribute',
            });
        });
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
            });
        });
        browser.waitForExist('[data-test="swapHorzVertButton"]');
        browser.click('[data-test="swapHorzVertButton"]');
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'clinical_attribute',
            });
        });
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'AGE',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab search case id in clinical vs clinical boxplot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.executeSearchCase(
                'kjpoij12     TCGA-B6 asdfas TCGA-A7-A13'
            );
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical stacked bar plot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'AJCC_TUMOR_PATHOLOGIC_PT',
            });
        });
        waitForAndCheckPlotsTab();
    });
    //commenting this for now because of https://github.com/zinserjan/wdio-screenshot/issues/87
    /* it("plots tab clinical vs clinical grouped bar plot", function() {
        browser.execute(function() { resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({ value: "Bar" }); });
        waitForAndCheckPlotsTab();
    }); */
    it('plots tab clinical vs clinical percentage stacked bar plot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'PercentageStackedBar',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical horizontal stacked bar plot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'StackedBar',
            });
        });
        browser.click('input[data-test="horizontalBars"]');
        waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical horizontal grouped bar plot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'Bar',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical horizontal percentage stacked bar plot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'PercentageStackedBar',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical table plot', function() {
        browser.click('input[data-test="horizontalBars"]');
        browser.execute(function() {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'Table',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab copy number vs clinical stacked bar plot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'StackedBar',
            });
        });
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'COPY_NUMBER_ALTERATION',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab copy number vs clinical horizontal stacked bar plot', function() {
        browser.click('input[data-test="horizontalBars"]');
        waitForAndCheckPlotsTab();
    });
    it('plots tab copy number vs clinical horizontal percentage stacked bar plot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'PercentageStackedBar',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab copy number vs clinical percentage stacked bar plot', function() {
        browser.click('input[data-test="horizontalBars"]');
        waitForAndCheckPlotsTab();
    });
    it('plots tab copy number vs clinical table plot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'Table',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab mutations wildtype mode vs clinical stacked bar plot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'StackedBar',
            });
        });
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisMutationCountBySelect({
                value: 'MutatedVsWildType',
            });
        });
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'MUTATION_EXTENDED',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab mutations wildtype mode vs clinical horizontal stacked bar plot', function() {
        browser.click('input[data-test="horizontalBars"]');
        waitForAndCheckPlotsTab();
    });
    it('plots tab mutations wildtype mode vs clinical horizontal percentage stacked bar plot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'PercentageStackedBar',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab mutations wildtype mode vs clinical percentage stacked bar plot', function() {
        browser.click('input[data-test="horizontalBars"]');
        waitForAndCheckPlotsTab();
    });
    it('plots tab mutations wildtype mode vs clinical table plot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'Table',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab mutations vs clinical stacked bar plot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'StackedBar',
            });
        });
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisMutationCountBySelect({
                value: 'MutationType',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab mutations vs clinical horizontal stacked bar plot', function() {
        browser.click('input[data-test="horizontalBars"]');
        waitForAndCheckPlotsTab();
    });
    it('plots tab mutations vs clinical horizontal percentage stacked bar plot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'PercentageStackedBar',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab mutations vs clinical percentage stacked bar plot', function() {
        browser.click('input[data-test="horizontalBars"]');
        waitForAndCheckPlotsTab();
    });
    it('plots tab mutations vs clinical table plot', function() {
        browser.execute(function() {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'Table',
            });
        });
        waitForAndCheckPlotsTab();
    });
    it('plots tab one box clinical vs clinical boxplot', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?cancer_study_id=lgg_ucsf_2014&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=lgg_ucsf_2014_sequenced&gene_list=SMARCA4%2520CIC&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_mutations&show_samples=true&clinicallist=MUTATION_COUNT`
        );
        browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]', 20000);
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'clinical_attribute',
            });
        });
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'CANCER_TYPE',
            });
        });
        waitForAndCheckPlotsTab();
    });

    it('plots tab mutations profile with duplicates', function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_Non-Small_Cell_Lung_Cancer&gene_list=TP53&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`
        );
        browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]', 20000);
        browser.execute(function() {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'MUTATION_EXTENDED',
            });
        });
        waitForAndCheckPlotsTab();
    });

    it('plots tab scatter plot color by tumor type', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&session_id=5ed80b90e4b030a3bfd0c662&plots_coloring_selection=%7B%22selectedOption%22%3A%22undefined_%7B%5C%22displayName%5C%22%3A%5C%22Tumor%20Type%5C%22%2C%5C%22description%5C%22%3A%5C%22Tumor%20Type%5C%22%2C%5C%22datatype%5C%22%3A%5C%22STRING%5C%22%2C%5C%22patientAttribute%5C%22%3Afalse%2C%5C%22priority%5C%22%3A%5C%221%5C%22%2C%5C%22clinicalAttributeId%5C%22%3A%5C%22TUMOR_TYPE%5C%22%2C%5C%22studyId%5C%22%3A%5C%22ccle_broad_2019%5C%22%7D%22%7D&plots_horz_selection=%7B%22dataType%22%3A%22MRNA_EXPRESSION%22%2C%22selectedGeneOption%22%3A672%2C%22mutationCountBy%22%3A%22MutationType%22%2C%22logScale%22%3A%22false%22%7D&plots_vert_selection=%7B%22selectedGeneOption%22%3A672%2C%22dataType%22%3A%22TREATMENT_RESPONSE%22%2C%22selectedGenericAssayOption%22%3A%22Afatinib-1%22%2C%22selectedDataSourceOption%22%3A%22CCLE_drug_treatment_AUC%22%2C%22mutationCountBy%22%3A%22MutationType%22%2C%22logScale%22%3A%22false%22%7D&tab_index=tab_visualize`
        );
        waitForAndCheckPlotsTab();
    });
    it('plots tab scatter plot color by tumor type highlight categories', () => {
        browser.click(`svg#plots-tab-plot-svg .legendLabel_breast`);
        browser.click(`svg#plots-tab-plot-svg .legendLabel_glioma`);
        waitForAndCheckPlotsTab();
    });

    it('plots tab box plot color by tumor type', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&plots_coloring_selection=%7B"selectedOption"%3A"undefined_%7B%5C"displayName%5C"%3A%5C"Tumor%20Type%5C"%2C%5C"description%5C"%3A%5C"Tumor%20Type%5C"%2C%5C"datatype%5C"%3A%5C"STRING%5C"%2C%5C"patientAttribute%5C"%3Afalse%2C%5C"priority%5C"%3A%5C"1%5C"%2C%5C"clinicalAttributeId%5C"%3A%5C"TUMOR_TYPE%5C"%2C%5C"studyId%5C"%3A%5C"ccle_broad_2019%5C"%7D"%7D&plots_horz_selection=%7B"dataType"%3A"MRNA_EXPRESSION"%2C"selectedGeneOption"%3A672%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A672%2C"dataType"%3A"MUTATION_EXTENDED"%2C"selectedGenericAssayOption"%3A"Afatinib-1"%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&session_id=5ed80b90e4b030a3bfd0c662&tab_index=tab_visualize`
        );
        waitForAndCheckPlotsTab();
    });
    it('plots tab box plot color by tumor type highlight categories', () => {
        browser.click(`svg#plots-tab-plot-svg .legendLabel_breast`);
        browser.click(`svg#plots-tab-plot-svg .legendLabel_glioma`);
        waitForAndCheckPlotsTab();
    });

    it('plots tab waterfall plot color by tumor type', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&plots_coloring_selection=%7B"selectedOption"%3A"undefined_%7B%5C"displayName%5C"%3A%5C"Tumor%20Type%5C"%2C%5C"description%5C"%3A%5C"Tumor%20Type%5C"%2C%5C"datatype%5C"%3A%5C"STRING%5C"%2C%5C"patientAttribute%5C"%3Afalse%2C%5C"priority%5C"%3A%5C"1%5C"%2C%5C"clinicalAttributeId%5C"%3A%5C"TUMOR_TYPE%5C"%2C%5C"studyId%5C"%3A%5C"ccle_broad_2019%5C"%7D"%7D&plots_horz_selection=%7B"dataType"%3A"none"%2C"selectedGeneOption"%3A672%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A672%2C"dataType"%3A"TREATMENT_RESPONSE"%2C"selectedGenericAssayOption"%3A"Afatinib-1"%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&session_id=5ed80b90e4b030a3bfd0c662&tab_index=tab_visualize`
        );
        waitForAndCheckPlotsTab();
    });
    it('plots tab waterfall plot color by tumor type highlight categories', () => {
        browser.click(`svg#plots-tab-plot-svg .legendLabel_breast`);
        browser.click(`svg#plots-tab-plot-svg .legendLabel_glioma`);
        waitForAndCheckPlotsTab();
    });

    it('plots tab scatter plot color by mutation count', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&plots_coloring_selection=%7B"selectedOption"%3A"undefined_%7B%5C"displayName%5C"%3A%5C"Mutation%20Count%5C"%2C%5C"description%5C"%3A%5C"Mutation%20Count%5C"%2C%5C"datatype%5C"%3A%5C"NUMBER%5C"%2C%5C"patientAttribute%5C"%3Afalse%2C%5C"priority%5C"%3A%5C"30%5C"%2C%5C"clinicalAttributeId%5C"%3A%5C"MUTATION_COUNT%5C"%2C%5C"studyId%5C"%3A%5C"ccle_broad_2019%5C"%7D"%7D&plots_horz_selection=%7B"dataType"%3A"MRNA_EXPRESSION"%2C"selectedGeneOption"%3A672%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A672%2C"dataType"%3A"TREATMENT_RESPONSE"%2C"selectedGenericAssayOption"%3A"Afatinib-1"%2C"selectedDataSourceOption"%3A"CCLE_drug_treatment_AUC"%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&session_id=5ed80b90e4b030a3bfd0c662&tab_index=tab_visualize`
        );
        waitForAndCheckPlotsTab();
    });
    it('plots tab scatter plot color by mutation count log scale', () => {
        browser.click('.coloringLogScale');
        waitForAndCheckPlotsTab();
    });

    it('plots tab box plot color by mutation count', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&plots_coloring_selection=%7B"selectedOption"%3A"undefined_%7B%5C"displayName%5C"%3A%5C"Mutation%20Count%5C"%2C%5C"description%5C"%3A%5C"Mutation%20Count%5C"%2C%5C"datatype%5C"%3A%5C"NUMBER%5C"%2C%5C"patientAttribute%5C"%3Afalse%2C%5C"priority%5C"%3A%5C"30%5C"%2C%5C"clinicalAttributeId%5C"%3A%5C"MUTATION_COUNT%5C"%2C%5C"studyId%5C"%3A%5C"ccle_broad_2019%5C"%7D"%2C"logScale"%3A"false"%7D&plots_horz_selection=%7B"dataType"%3A"MRNA_EXPRESSION"%2C"selectedGeneOption"%3A672%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A672%2C"dataType"%3A"MUTATION_EXTENDED"%2C"selectedGenericAssayOption"%3A"Afatinib-1"%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&session_id=5ed80b90e4b030a3bfd0c662&tab_index=tab_visualize`
        );
        waitForAndCheckPlotsTab();
    });
    it('plots tab box plot color by mutation count log scale', () => {
        browser.click('.coloringLogScale');
        waitForAndCheckPlotsTab();
    });

    it('plots tab waterfall plot color by mutation count', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&plots_coloring_selection=%7B"selectedOption"%3A"undefined_%7B%5C"displayName%5C"%3A%5C"Mutation%20Count%5C"%2C%5C"description%5C"%3A%5C"Mutation%20Count%5C"%2C%5C"datatype%5C"%3A%5C"NUMBER%5C"%2C%5C"patientAttribute%5C"%3Afalse%2C%5C"priority%5C"%3A%5C"30%5C"%2C%5C"clinicalAttributeId%5C"%3A%5C"MUTATION_COUNT%5C"%2C%5C"studyId%5C"%3A%5C"ccle_broad_2019%5C"%7D"%2C"logScale"%3A"false"%7D&plots_horz_selection=%7B"dataType"%3A"none"%2C"selectedGeneOption"%3A672%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A672%2C"dataType"%3A"TREATMENT_RESPONSE"%2C"selectedGenericAssayOption"%3A"Afatinib-1"%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&session_id=5ed80b90e4b030a3bfd0c662&tab_index=tab_visualize`
        );
        waitForAndCheckPlotsTab();
    });
    it('plots tab waterfall plot color by mutation count log scale', () => {
        browser.click('.coloringLogScale');
        waitForAndCheckPlotsTab();
    });
});

describe('plots tab multiple studies screenshot tests', function() {
    before(function() {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=lgg_ucsf_2014%2Cbrca_tcga&case_set_id=all&data_priority=0&gene_list=TP53&geneset_list=%20&plots_coloring_selection=%7B%7D&plots_horz_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"CANCER_TYPE_DETAILED"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"CANCER_TYPE"%7D&profileFilter=0&tab_index=tab_visualize`
        );
        browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]', 20000);
    });
    it('plots tab multiple studies with data availability alert', function() {
        waitForAndCheckPlotsTab();
    });
});

var goToUrlAndSetLocalStorage = require('../../../shared/specUtils').goToUrlAndSetLocalStorage;
var assertScreenShotMatch = require('../../../shared/lib/testUtils').assertScreenShotMatch;

function waitForAndCheckPlotsTab() {
    browser.moveToObject("body", 0, 0);
    browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]', 10000);
    var res = browser.checkElement('div[data-test="PlotsTabEntireDiv"]', { hide:['.qtip'] });
    assertScreenShotMatch(res);
}

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe("plots tab screenshot tests", function() {
    it("plots tab mutations profile with duplicates", function() {
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/results/plots?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_Non-Small_Cell_Lung_Cancer&gene_list=TP53&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`);
        browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]', 20000);
        browser.execute(function() { resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({ value: "MUTATION_EXTENDED" }); });
        waitForAndCheckPlotsTab();
    });
});
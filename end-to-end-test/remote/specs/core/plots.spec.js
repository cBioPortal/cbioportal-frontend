var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var assert = require('assert');
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('plots tab tests', function() {
    it('shows data availability alert tooltip for plots tab multiple studies', () => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=lgg_ucsf_2014%2Cbrca_tcga&case_set_id=all&data_priority=0&gene_list=TP53&geneset_list=%20&plots_coloring_selection=%7B%7D&plots_horz_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"CANCER_TYPE_DETAILED"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"CANCER_TYPE"%7D&profileFilter=0&tab_index=tab_visualize`
        );
        browser.waitForVisible('div[data-test="PlotsTabPlotDiv"]', 20000);
        // Tooltip elements are created when hovering the data availability alert info icon.
        // Control logic below is needed to access the last one after it
        // was created.
        var curNumToolTips = $$('div.rc-tooltip-inner').length;
        browser.moveToObject("[data-test='dataAvailabilityAlertInfoIcon']");
        browser.waitUntil(
            () => $$('div.rc-tooltip-inner').length > curNumToolTips
        );
        var toolTips = $$('div.rc-tooltip-inner');
        var text = toolTips[toolTips.length - 1].getText();
        assert.equal(
            text,
            'The data on Horizontal Axis and Vertical Axis can come from different studies.\nOnly data from studies that exist in both axes will be shown on the plots.\nHorizontal Axis: 1164 samples from 2 studies\nVertical Axis: 1164 samples from 2 studies'
        );
    });
});

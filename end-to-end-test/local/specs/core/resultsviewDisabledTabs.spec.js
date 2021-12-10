var assert = require('assert');
var goToUrlAndSetLocalStorageWithProperty = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorageWithProperty;
var { waitForOncoprint } = require('../../../shared/specUtils');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const url = `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&data_priority=0&gene_list=ABLIM1%250ATMEM247&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize`;

describe('results view check possibility to disable tabs', function() {
    it('check that all tabs can be disabled', () => {
        goToUrlAndSetLocalStorage(url, true);
        waitForOncoprint();
        $('.msk-tabs.posRelative.mainTabs').waitForDisplayed();
        // getting all visible tabs, excluding the first one, oncoprint
        tabs = $('.nav-tabs')
            .$$('.tabAnchor')
            .filter(tab => tab.isDisplayed())
            .filter(
                tab =>
                    tab.getAttribute('class') !==
                    'tabAnchor tabAnchor_oncoprint'
            )
            .map(tab =>
                tab
                    .getAttribute('class')
                    .split('_')
                    .pop()
            );
        // test that each tab can be disabled
        message = '';
        allTabsDisabled = true;
        console.log(tabs);
        tabs.forEach(tab => {
            goToUrlAndSetLocalStorageWithProperty(url, true, {
                disabled_tabs: tab,
            });
            $('.msk-tabs.posRelative.mainTabs').waitForDisplayed();
            if ($('.tabAnchor.tabAnchor_' + tab).isDisplayed()) {
                message = message + 'Tab ' + tab + ' could not be disabled; ';
                allTabsDisabled = false;
            }
        });
        assert(allTabsDisabled == true, message);
    });
});

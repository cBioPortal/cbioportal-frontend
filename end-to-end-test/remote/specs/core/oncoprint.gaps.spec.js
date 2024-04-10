const {
    getNthOncoprintTrackOptionsElements,
} = require('../../../shared/specUtils');
var waitForOncoprint = require('../../../shared/specUtils').waitForOncoprint;

var getElementByTestHandle = require('../../../shared/specUtils')
    .getElementByTestHandle;

var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var setInputText = require('../../../shared/specUtils').setInputText;
var waitForNumberOfStudyCheckboxes = require('../../../shared/specUtils')
    .waitForNumberOfStudyCheckboxes;
var checkOncoprintElement = require('../../../shared/specUtils')
    .checkOncoprintElement;
var getGroupHeaderOptionsElements = require('../../../shared/specUtils')
    .getOncoprintGroupHeaderOptionsElements;
var setDropdownOpen = require('../../../shared/specUtils').setDropdownOpen;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const ONCOPRINT_TIMEOUT = 60000;

describe('oncoprint gap screenshot tests', function() {
    before(() => {
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_cna&gene_list=BCHE%252CCDK8%252CCTBP1%252CACKR3&gene_set_choice=user-defined-list&&clinicallist=SEX,CANCER_TYPE_DETAILED&profileFilter=mutations%2Cgistic&geneset_list=%20&tab_index=tab_visualize&Action=Submit`
        );
        waitForOncoprint();
    });
    it('shows gaps for sex track with correct subgroup percentages', function() {
        const sexElements = getNthOncoprintTrackOptionsElements(1);
        setDropdownOpen(
            true,
            sexElements.button_selector,
            sexElements.dropdown_selector,
            'Failed to open sex track menu'
        );
        $(`${sexElements.dropdown_selector} li:nth-child(9)`).click(); // Click "show gaps"
        browser.pause(100); // give time to sort and insert gaps

        waitForOncoprint();

        $('.oncoprint__zoom-controls .fa-search-minus').click();
        $('.oncoprint__zoom-controls .fa-search-minus').click();

        browser.pause(100); // give time to rezoom

        const res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('hierarchical sorting when two tracks have enabled gaps', () => {
        const cancerTypeDetailedElements = getNthOncoprintTrackOptionsElements(
            2
        );
        setDropdownOpen(
            true,
            cancerTypeDetailedElements.button_selector,
            cancerTypeDetailedElements.dropdown_selector,
            'Failed to open cancer type detailed track menu'
        );
        $(
            `${cancerTypeDetailedElements.dropdown_selector} li:nth-child(9)`
        ).click(); // Click "show gaps"
        browser.pause(100); // give time to sort and insert gaps

        waitForOncoprint();

        const res = checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
});

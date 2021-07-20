var assert = require('assert');
const waitForStudyView = require('../../shared/specUtils').waitForStudyView;
const goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
const waitForGroupComparisonTabOpen = require('../../shared/specUtils')
    .waitForGroupComparisonTabOpen;
const { setDropdownOpen } = require('../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`;

describe('color chooser for groups menu in study view', function() {
    const genderPies =
        '[data-test=chart-container-SEX] .studyViewPieChartGroup path';
    const oncotreePies =
        '[data-test=chart-container-ONCOTREE_CODE] .studyViewPieChartGroup path';
    const survivalPies =
        '[data-test=chart-container-OS_STATUS] .studyViewPieChartGroup path';
    const groupsMenuButton = '[data-test=groups-button]';
    const createNewGroupButton = '[data-test=create-new-group-btn]';
    const finalizeGroupButton = 'button=Create';
    const colorIconRect = '[data-test=color-picker-icon] rect';
    const colorIcon = '[data-test=color-picker-icon]';
    const colorPickerBlue = '.circle-picker [title="#2986E2"]';
    const colorIconBlue = 'svg rect[fill="#2986e2"]';
    const colorPickerGreen = '.circle-picker [title="#109618"]';
    const colorIconEmpty = 'svg rect[fill="#FFFFFF"]';
    const warningSign = '.fa.fa-warning';
    const groupCheckboxes = '[data-test=group-checkboxes] input';
    const compareButton = 'button=Compare';
    const gbGroupButton = '[data-test=groupSelectorButtonGB]';
    const oastGroupButton = '[data-test=groupSelectorButtonOAST]';

    const gbGroupColorIcon = `[data-test="group-checkboxes"] [data-test="GB"] ${colorIcon}`;
    const gbGroupColorIconRect = `[data-test="group-checkboxes"] [data-test="GB"] ${colorIconRect}`;
    const gbGroupColorIconEmpty = `[data-test="group-checkboxes"] [data-test="GB"] ${colorIconEmpty}`;
    const gbGroupColorIconBlue = `[data-test="group-checkboxes"] [data-test="GB"] ${colorIconBlue}`;

    before(() => {
        goToUrlAndSetLocalStorage(studyViewUrl, true);
        waitForStudyView();
        deleteAllGroups();
    });

    it('shows no icon color for new group', () => {
        // select GB on the oncotree pie chart
        const cancertypeGbPie = $$(oncotreePies)[1];
        cancertypeGbPie.click();

        // open group menu and create group from selected samples
        openGroupsMenu();
        $(createNewGroupButton).click();
        $(finalizeGroupButton).click();

        // check color
        $(gbGroupColorIconRect).waitForExist();
        const GroupGbColorIcon = $(gbGroupColorIconRect);
        assert.strictEqual(GroupGbColorIcon.getAttribute('fill'), '#FFFFFF');
    });

    it('shows new color in icon when new color is selected', () => {
        // open color picker and select blue
        setDropdownOpen(true, gbGroupColorIcon, colorPickerBlue);
        $(colorPickerBlue).click();
        $(gbGroupColorIconBlue).waitForExist();
        // check the color icon
        const GroupGbColorIcon = $(gbGroupColorIconRect);
        assert.strictEqual(GroupGbColorIcon.getAttribute('fill'), '#2986e2');
    });

    it('selects no color after pressing same color', () => {
        setDropdownOpen(true, gbGroupColorIcon, colorPickerBlue);
        // unselect blue and check the color icon
        $(colorPickerBlue).click();
        $(gbGroupColorIconEmpty).waitForExist();
        const groupGBColorIcon = $(gbGroupColorIconRect);
        assert.strictEqual(groupGBColorIcon.getAttribute('fill'), '#FFFFFF');
    });

    it('warns of same color in groups selected for comparison', () => {
        // close the color picker and group menu
        setDropdownOpen(false, gbGroupColorIcon, colorPickerBlue);
        closeGroupsMenu();

        // unselect previous oncotree code and select another
        $$(oncotreePies)[1].click();
        $$(oncotreePies)[2].click();

        // create a group for it
        openGroupsMenu();
        $(createNewGroupButton).click();
        $(finalizeGroupButton).click();

        // select same color for both groups
        browser.waitUntil(() => $$(colorIcon).length === 2);
        setDropdownOpen(true, gbGroupColorIcon, colorPickerBlue);
        $(colorPickerBlue).click();
        // close color picker 0 before going to next one
        setDropdownOpen(false, gbGroupColorIcon, colorPickerBlue);
        setDropdownOpen(true, $$(colorIcon)[1], colorPickerBlue);
        $(colorPickerBlue).click();

        // assert that warning sign exists
        $(warningSign).waitForExist();
        assert($(warningSign).isExisting());
    });

    it('does not warn of same color when one of groups is not selected for comparison', () => {
        // unselect one group for comparison
        $(groupCheckboxes).click();
        // assert that there is no warning sign
        assert(!$(warningSign).isExisting());
    });

    it('shows default color for male/female groups', () => {
        // create female group and check predefined color
        $(groupsMenuButton).click();
        const genderTypeGbPie = $$(genderPies)[1];
        genderTypeGbPie.click();

        openGroupsMenu();
        $(createNewGroupButton).click();
        $(finalizeGroupButton).click();

        browser.waitUntil(() => $$(colorIconRect).length === 3);
        const GroupGbColorIcon = $$(colorIconRect)[2];
        assert.strictEqual(GroupGbColorIcon.getAttribute('fill'), '#E0699E');
    });

    it('shows undefined color when two groups with predefined colors are selected', () => {
        // select living on overall survival chart (female is already selected from previous test)
        $(groupsMenuButton).click();
        const survivalLivingPie = $$(survivalPies)[0];
        survivalLivingPie.click();
        // create living female group and check there is no color
        openGroupsMenu();
        $(createNewGroupButton).click();
        $(finalizeGroupButton).click();

        browser.waitUntil(() => $$(colorIconRect).length === 4);
        const livingFemaleColorIcon = $$(colorIconRect)[2];
        assert.strictEqual(
            livingFemaleColorIcon.getAttribute('fill'),
            '#FFFFFF'
        );
    });

    it('stores group colors in study view user session', () => {
        // refresh the page and check if color is still present
        browser.refresh();
        $(groupsMenuButton).waitForExist();
        $(groupsMenuButton).click();
        $(colorIconRect).waitForExist();
        assert.strictEqual($(colorIconRect).getAttribute('fill'), '#2986e2');
    });

    it('uses custom colors in group comparison view', () => {
        // compare first 2 groups (GB and OAST) after changing the color of OAST

        // select GB and OAST groups
        $$(groupCheckboxes)[0].click();
        $$(groupCheckboxes)[1].click();

        // GB group remains blue; OAST becomes green
        $$(colorIcon)[1].click();
        $(colorPickerGreen).click();

        // open comparison tab
        const studyViewTabId = browser.getWindowHandles()[0];
        $(compareButton).click();
        browser.waitUntil(() => browser.getWindowHandles().length > 1); // wait until new tab opens
        const groupComparisonTabId = browser
            .getWindowHandles()
            .find(id => id !== studyViewTabId);
        browser.switchToWindow(groupComparisonTabId);
        waitForGroupComparisonTabOpen();

        // check that selected colors are used
        assert.strictEqual(
            $(gbGroupButton).getAttribute('style'),
            'background-color: rgb(41, 134, 226);'
        );
        assert.strictEqual(
            $(oastGroupButton).getAttribute('style'),
            'background-color: rgb(16, 150, 24);'
        );
    });

    const openGroupsMenu = () => {
        setDropdownOpen(true, groupsMenuButton, createNewGroupButton);
    };
    const closeGroupsMenu = () => {
        setDropdownOpen(false, groupsMenuButton, createNewGroupButton);
    };
    const deleteAllGroups = () => {
        openGroupsMenu();
        try {
            $('[data-test="deleteGroupButton"]').waitForExist();
            for (const button of $$('[data-test="deleteGroupButton"]')) {
                button.click();
            }
        } catch (e) {
            // no groups to delete
        }
        closeGroupsMenu();
    };
});

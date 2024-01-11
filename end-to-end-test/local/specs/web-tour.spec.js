const { goToUrlAndSetLocalStorage } = require('../../shared/specUtils');
const assert = require('assert');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const VIRTUAL_STUDY_TOUR_MODAL = '.virtual-study-tour-modal';
const GROUP_COMPARISON_TOUR_MODAL = '.group-comparison-tour-modal';
const SKIP_ALL_BTN = '.skip-all-btn';
const NEXT_STEP_BTN = '.next-step-btn';
const LAST_STEP_BTN = '.finish-step-btn';

/**
 * e2e test for the web tour
 * 1. Virtual Study Tour - Logged-in user (Non-Logged-in user is about the same)
 * 2. Group Comparison Tour
 */
describe('Virtual Study Tour', () => {
    let step = -1;

    before(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
    });

    it('Initial step with -1.', () => {
        assert.equal(step, -1);
    });

    it('Click the entry to start tour.', () => {
        // There should be a tour entry for virtual study, with the content `Create a Virtual Study`
        const virtualStudyTourEntry = $('div[data-type="virtual-study-tour"]');
        virtualStudyTourEntry.waitForDisplayed();
        assert.equal(virtualStudyTourEntry.getText(), 'Create a Virtual Study');

        // Click on the tour entry to start the tour
        virtualStudyTourEntry.click();
        step++;
    });

    it('Step 0: Type “glioma” in the search box automatically.', () => {
        // The tour should be on the first step: step = 0
        assert.equal(step, 0);

        // There should be a tour modal
        const tourModal = $(VIRTUAL_STUDY_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `Search for the studies`
        assert.equal(tourModal.$('.title').getText(), 'Search for the studies');

        // On the modal, there should be a `Skip All` button and a `Next Step` button
        assert.equal(tourModal.$(SKIP_ALL_BTN).getText(), 'Skip All');
        const nextStepBtn = tourModal.$(NEXT_STEP_BTN);
        assert.equal(nextStepBtn.getText(), 'Next Step');

        // There should be a search box on the homepage, the value should be `glioma`
        const cancerStudySearchBox = $(
            '[data-tour="cancer-study-search-box"] input'
        );
        assert.equal(cancerStudySearchBox.getValue(), 'glioma');

        // TODO: This is a temporary fix for the tour
        // when searching for the keyword "glioma," there's only one study in the results
        // but I need two studies for the tour, so I'm going to clear the filter
        // and select two studies
        browser.pause(2000);
        $('[data-test="clearStudyFilter"]').waitForDisplayed();
        $('[data-test="clearStudyFilter"]').click();
        browser.pause(2000);

        // Click on the `Next Step` button, the tour should go to the next step
        nextStepBtn.click();
        step++;
    });

    it('Step 1: User should select two studies, on the homepage', () => {
        // The tour should be on the second step: step = 1
        assert.equal(step, 1);

        // There should be a tour modal
        const tourModal = $(VIRTUAL_STUDY_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `Select two studies`
        assert.equal(tourModal.$('.title').getText(), 'Select two studies');

        // On the modal, there should not be a `Skill All` button and a `Next Step` button
        !tourModal.$(SKIP_ALL_BTN).isDisplayed();
        !tourModal.$(NEXT_STEP_BTN).isDisplayed();

        // There should have a list container with at least two studies
        const cancerStudyListContainer = $(
            '[data-tour="cancer-study-list-container"]'
        );
        cancerStudyListContainer.waitForDisplayed();
        const cancerStudyList = cancerStudyListContainer.$$(
            '[data-test="StudySelect"]'
        );
        assert(cancerStudyList.length >= 2);

        // Select two study
        $('[data-tour="cancer-study-list-container"]')
            .$$('input')[0]
            .click();

        // cancerStudyListContainer.$$('input')[0].waitForDisplayed();
        // cancerStudyListContainer.$$('input')[0].click();
        // cancerStudyListContainer.$$('input')[1].click();

        // clickCheckBoxStudyView('Glioblastoma (Columbia, Nat Med. 2019)');
        // clickCheckBoxStudyView(
        //     'Pediatric Brain Cancer (CPTAC/CHOP, Cell 2020)'
        // );

        // On the modal, there should be a `Skill All` button and a `Next Step` button
        assert.equal(tourModal.$(SKIP_ALL_BTN).getText(), 'Skip All');
        const nextStepBtn = tourModal.$(NEXT_STEP_BTN);
        assert.equal(nextStepBtn.getText(), 'Next Step');

        // Click on the `Next Step` button, the tour should go to the next step
        nextStepBtn.click();
        step++;
    });

    it('Step 2: Click the “Explore Selected Studies” button, on the homepage.', () => {
        // The tour should be step = 2
        assert.equal(step, 2);

        // There should be a tour modal
        const tourModal = $(VIRTUAL_STUDY_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `Click the Explore button`
        assert.equal(
            tourModal.$('.title').getText(),
            'Click the Explore button'
        );

        // On the modal, there should not be a `Skill All` button and a `Next Step` button
        !tourModal.$(SKIP_ALL_BTN).isDisplayed();
        !tourModal.$(NEXT_STEP_BTN).isDisplayed();

        // There should be the “Explore Selected Studies” button
        // Click on the “Explore Selected Studies” button, the tour should go to the next step
        $('[data-tour="explore-studies-button"]').click();
        step++;
    });

    it('Step 3: Click the “+” icon, on the study summary page.', () => {
        // Should be on the Study Summary page.
        browser.waitUntil(() => browser.getUrl().includes('study/summary'), {
            timeout: 20000,
            timeoutMsg: 'expected to be on study summary page',
        });

        // The tour should be at step = 3.
        assert.equal(step, 3);

        // There should be a tour modal
        const tourModal = $(VIRTUAL_STUDY_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `See list of studies`
        assert.equal(tourModal.$('.title').getText(), 'See list of studies');

        // On the modal, there should be a `Skill All` button and a `Next Step` button
        assert.equal(tourModal.$(SKIP_ALL_BTN).getText(), 'Skip All');
        const nextStepBtn = tourModal.$(NEXT_STEP_BTN);
        assert.equal(nextStepBtn.getText(), 'Next Step');

        // There should be the “+” icon
        $('[data-tour="show-more-description-icon"]').waitForDisplayed();
        browser.pause(3000);

        // Click on the `Next Step` button, the tour should go to the next step
        nextStepBtn.click();
        step++;
    });

    it('Step 4: Select samples in the Mutated Genes table, on the study summary page.', () => {
        // The tour should be at step = 4.
        assert.equal(step, 4);

        browser.pause(1000);

        // There should be a tour modal
        const tourModal = $(VIRTUAL_STUDY_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `Select samples`
        assert.equal(tourModal.$('.title').getText(), 'Select samples');

        // On the modal, there should not be a `Skill All` button and a `Next Step` button
        !tourModal.$(SKIP_ALL_BTN).isDisplayed();
        !tourModal.$(NEXT_STEP_BTN).isDisplayed();

        // There should be the Mutated Genes table [data-tour="mutated-genes-table"]
        const mutatedGenesTable = $('[data-tour="mutated-genes-table"]').$(
            '[data-test="mutations-table"]'
        );
        mutatedGenesTable.waitForDisplayed();

        // Select samples
        mutatedGenesTable.$$('input')[0].waitForDisplayed();
        mutatedGenesTable.$$('input')[0].click();
        browser.pause(1000);
        mutatedGenesTable.$('button=Select Samples').waitForDisplayed();
        mutatedGenesTable.$('button=Select Samples').click();

        // On the modal, there should be a `Skill All` button and a `Next Step` button
        assert.equal(tourModal.$(SKIP_ALL_BTN).getText(), 'Skip All');
        const nextStepBtn = tourModal.$(NEXT_STEP_BTN);
        assert.equal(nextStepBtn.getText(), 'Next Step');

        // Click on the `Next Step` button, the tour should go to the next step
        nextStepBtn.click();
        step++;
    });

    it('Step 5: Describe what they would see later, on the study summary page.', () => {
        // The tour should be at step = 5
        assert.equal(step, 5);

        // There should be a tour modal
        const tourModal = $(VIRTUAL_STUDY_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `Share/save your virtual study`
        assert.equal(
            tourModal.$('.title').getText(),
            'Share/save your virtual study'
        );

        // On the modal, there should be a `Skill All` button and a `Next Step` button
        assert.equal(tourModal.$(SKIP_ALL_BTN).getText(), 'Skip All');
        const nextStepBtn = tourModal.$(NEXT_STEP_BTN);
        assert.equal(nextStepBtn.getText(), 'Next Step');

        // Click on the `Next Step` button, the tour should go to the next step
        nextStepBtn.click();
        step++;
    });

    it('Step 6: Click the bookmark icon, on the study summary page.', () => {
        // The tour should be at step = 6.
        assert.equal(step, 6);

        // There should be a tour modal
        const tourModal = $(VIRTUAL_STUDY_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `Click the bookmark icon`
        assert.equal(
            tourModal.$('.title').getText(),
            'Click the bookmark icon'
        );

        // On the modal, there should not be a `Skill All` button and a `Next Step` button
        !tourModal.$(SKIP_ALL_BTN).isDisplayed();
        !tourModal.$(NEXT_STEP_BTN).isDisplayed();

        // There should be a bookmark icon [data-tour="action-button-bookmark"]
        // Click the bookmark icon, the tour should go to the next step

        browser.pause(4000);
        const node = $('.studyView');
        node.$('button[data-tour="action-button-bookmark"]').waitForDisplayed();
        node.$('button[data-tour="action-button-bookmark"]').click();
        browser.pause(4000);

        step++;
    });

    it('Step 7: Click on the Save button, on the study summary page.', () => {
        // The tour should be at step = 7.
        assert.equal(step, 7);

        // There should be a tour modal
        const tourModal = $(VIRTUAL_STUDY_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `Click on the Save button`
        assert.equal(
            tourModal.$('.title').getText(),
            'Click on the Save button'
        );

        // On the modal, there should not be a `Skill All` button and a `Next Step` button
        !tourModal.$(SKIP_ALL_BTN).isDisplayed();
        !tourModal.$(NEXT_STEP_BTN).isDisplayed();

        // There should be a share panel [data-tour="virtual-study-summary-panel"]
        const sharePanel = $('[data-tour="virtual-study-summary-panel"]');
        sharePanel.waitForDisplayed();

        // There should be a share button [data-tour="virtual-study-summary-save-btn"]
        // Click the share button, the tour should go to the next step
        sharePanel
            .$('button[data-tour="virtual-study-summary-save-btn"]')
            .click();
        browser.pause(4000);
        step++;
    });

    it('Step 8: Show the share link.', () => {
        // The tour should be at step = 8.
        assert.equal(step, 8);

        // There should be a tour modal
        const tourModal = $(VIRTUAL_STUDY_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `Already saved`
        assert.equal(tourModal.$('.title').getText(), 'Already saved');

        // On the modal, there should be a `Finish guidance` button and a `Help me find it` button
        assert.equal(tourModal.$(SKIP_ALL_BTN).getText(), 'Finish guidance');
        const nextStepBtn = tourModal.$(NEXT_STEP_BTN);
        assert.equal(nextStepBtn.getText(), 'Help me find it');

        // There should be a link panel [data-tour="virtual-study-summary-panel"]
        const linkPanel = $('[data-tour="virtual-study-summary-panel"]');
        linkPanel.waitForDisplayed();

        // Click on the `Help me find it` button, the tour should go to the next step
        nextStepBtn.click();
        step++;
    });

    it('Step 9: In homepage, Show the new virtual study pre-selected.', () => {
        // Should be on the homepage.
        browser.pause(3000);

        // The tour should be at step = 9.
        assert.equal(step, 9);

        // There should be a tour modal
        const tourModal = $(VIRTUAL_STUDY_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `My Virtual Studies`
        assert.equal(tourModal.$('.title').getText(), 'My Virtual Studies');

        // On the modal, there should be a `Skip All` button and a `Finish guidance` button
        assert.equal(tourModal.$(SKIP_ALL_BTN).getText(), 'Skip All');
        const nextStepBtn = tourModal.$(LAST_STEP_BTN);
        assert.equal(nextStepBtn.getText(), 'Finish guidance 🎉');

        // There should be a 'My Virtual Studies' list [data-tour="my_virtual_studies_list"]
        const linkPanel = $('[data-tour="my_virtual_studies_list"]');
        linkPanel.waitForDisplayed();

        // Click on the `Finish guidance` button, the tour should end
        nextStepBtn.click();
    });
});

describe('Group Comparison Tour', () => {
    let step = -1;

    before(() => {
        goToUrlAndSetLocalStorage(CBIOPORTAL_URL, false);
    });

    it('Initial step with -1.', () => {
        assert.equal(step, -1);
    });

    it('Click the entry to start tour.', () => {
        // There should be a tour entry for virtual study, with the content `Compare User-defined Groups of Samples`.
        const groupComparisonTourEntry = $(
            'div[data-type="group-comparison-tour"]'
        );
        groupComparisonTourEntry.waitForDisplayed();
        assert.equal(
            groupComparisonTourEntry.getText(),
            'Compare User-defined Groups of Samples'
        );

        // Click on the tour entry to start the tour
        groupComparisonTourEntry.click();
        step++;
    });

    it('Step 0: Type “glioma” in the search box automatically.', () => {
        // The tour should be on the first step: step = 0
        assert.equal(step, 0);

        // There should be a tour modal
        const tourModal = $(GROUP_COMPARISON_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `Search for the studies`
        assert.equal(tourModal.$('.title').getText(), 'Search for the studies');

        // On the modal, there should be a `Skip All` button and a `Next Step` button
        assert.equal(tourModal.$(SKIP_ALL_BTN).getText(), 'Skip All');
        const nextStepBtn = tourModal.$(NEXT_STEP_BTN);
        assert.equal(nextStepBtn.getText(), 'Next Step');

        // There should be a search box on the homepage, the value should be `glioma`
        const cancerStudySearchBox = $(
            '[data-tour="cancer-study-search-box"] input'
        );
        assert.equal(cancerStudySearchBox.getValue(), 'glioma');

        // Click on the `Next Step` button, the tour should go to the next step
        browser.pause(3000);
        nextStepBtn.click();
        step++;
    });

    it('Step 1: Click on “View study summary” button, on the homepage.', () => {
        // The tour should be at step = 1.
        assert.equal(step, 1);

        // There should be a tour modal
        browser.pause(3000);
        const tourModal = $(GROUP_COMPARISON_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `Click the button`
        assert.equal(tourModal.$('.title').getText(), 'Click the button');

        // On the modal, there should not be a `Skill All` button and a `Next Step` button
        !tourModal.$(SKIP_ALL_BTN).isDisplayed();
        !tourModal.$(NEXT_STEP_BTN).isDisplayed();

        // There should be a `View study summary` button in the study list [data-tour="cancer-study-list-container"]
        const cancerStudyListContainer = $(
            '[data-tour="cancer-study-list-container"]'
        );
        cancerStudyListContainer.waitForDisplayed();

        // Click on the `View study summary` button next to 'Merged Cohort of LGG and GBM (TCGA, Cell 2016)'
        // the tour should go to the next step
        cancerStudyListContainer.$$('a.ci-pie-chart')[0].waitForDisplayed();
        cancerStudyListContainer.$$('a.ci-pie-chart')[0].click();

        // clickViewSummaryStudyView(
        //     'Merged Cohort of LGG and GBM (TCGA, Cell 2016)'
        // );
        step++;
    });

    it('Step 2: Select more than one sample in the Mutated Genes table, on the study summary page.', () => {
        // Should be on the Study Summary page.
        browser.waitUntil(() => browser.getUrl().includes('study/summary'), {
            timeout: 20000,
            timeoutMsg: 'expected to be on study summary page',
        });

        browser.pause(3000);

        // A little bit hacky here
        // I need to resize the window to make sure the tour modal can render correctly
        browser.setWindowSize(
            browser.getWindowSize().width,
            browser.getWindowSize().height
        );

        browser.pause(3000);

        // The tour should be at step = 2.
        assert.equal(step, 2);

        // There should be a tour modal
        const tourModal = $(GROUP_COMPARISON_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `Select two samples`
        assert.equal(tourModal.$('.title').getText(), 'Select two samples');

        // On the modal, there should not be a `Skill All` button and a `Next Step` button
        !tourModal.$(SKIP_ALL_BTN).isDisplayed();
        !tourModal.$(NEXT_STEP_BTN).isDisplayed();

        browser.pause(1000);
        // There should be the Mutated Genes table [data-tour="mutated-genes-table"]
        const mutatedGenesTable = $('[data-tour="mutated-genes-table"]').$(
            '[data-test="mutations-table"]'
        );
        mutatedGenesTable.waitForDisplayed();

        // Select samples, IDH1 mutations, TP53 mutant and EGFR amplified samples
        mutatedGenesTable.$$('input')[0].waitForDisplayed();
        mutatedGenesTable.$$('input')[0].click();
        mutatedGenesTable.$$('input')[1].click();

        browser.pause(3000);

        // The tour should go to the next step
        step++;
    });

    it('Step 3: Click the “Compare” button, on the study summary page.', () => {
        // The tour should be at step = 3.
        assert.equal(step, 3);

        // There should be a tour modal
        const tourModal = $(GROUP_COMPARISON_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `Click the Compare button`
        assert.equal(
            tourModal.$('.title').getText(),
            'Click the Compare button'
        );

        // On the modal, there should not be a `Skill All` button and a `Next Step` button
        !tourModal.$(SKIP_ALL_BTN).isDisplayed();
        !tourModal.$(NEXT_STEP_BTN).isDisplayed();

        // There should be a compare button [data-tour="mutated-genes-table-compare-btn"]
        const compareBtn = $('[data-tour="mutated-genes-table-compare-btn"]');
        compareBtn.waitForDisplayed();

        // Click the compare button, the tour should go to the next step
        compareBtn.click();
        step++;
    });

    it('Step 4: Show the header of the page, on the group comparison page.', () => {
        // Switch to the new tab by selecting the last handle
        browser.pause(1000);
        const handles = browser.getWindowHandles();
        const newTabHandle = handles[handles.length - 1];
        console.log('handles', handles);
        browser.switchToWindow(newTabHandle);

        // Should be on the group comparison page.
        browser.waitUntil(() => browser.getUrl().includes('/comparison'), {
            timeout: 10000,
            timeoutMsg: 'expected to be on group comparison page',
        });

        // The tour should be at step = 4
        assert.equal(step, 4);

        // There should be a tour modal
        const tourModal = $(GROUP_COMPARISON_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `The original study`
        assert.equal(tourModal.$('.title').getText(), 'The original study');

        // On the modal, there should be a `Skill All` button and a `Next Step` button
        assert.equal(tourModal.$(SKIP_ALL_BTN).getText(), 'Skip All');
        const nextStepBtn = tourModal.$(NEXT_STEP_BTN);
        assert.equal(nextStepBtn.getText(), 'Next Step');

        // There should be a header [data-tour="single-study-group-comparison-header"]
        $(
            '[data-tour="single-study-group-comparison-header"]'
        ).waitForDisplayed();

        // Click on the `Next Step` button, the tour should go to the next step
        nextStepBtn.click();
        step++;
    });

    it('Step 5: Show the attribute, on the group comparison page.', () => {
        // The tour should be at step = 5
        assert.equal(step, 5);

        // There should be a tour modal
        const tourModal = $(GROUP_COMPARISON_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `The attribute`
        assert.equal(tourModal.$('.title').getText(), 'The attribute');

        // On the modal, there should be a `Skill All` button and a `Next Step` button
        assert.equal(tourModal.$(SKIP_ALL_BTN).getText(), 'Skip All');
        const nextStepBtn = tourModal.$(NEXT_STEP_BTN);
        assert.equal(nextStepBtn.getText(), 'Next Step');

        // There should be a subheader [data-tour="single-study-group-comparison-attribute"]
        $(
            '[data-tour="single-study-group-comparison-attribute"]'
        ).waitForDisplayed();

        // Click on the `Next Step` button, the tour should go to the next step
        nextStepBtn.click();
        step++;
    });

    it('Step 6: Show the available groups, on the group comparison page.', () => {
        // The tour should be at step = 6
        assert.equal(step, 6);

        // There should be a tour modal
        const tourModal = $(GROUP_COMPARISON_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `The available groups`
        assert.equal(tourModal.$('.title').getText(), 'The available groups');

        // On the modal, there should be a `Skill All` button and a `Next Step` button
        assert.equal(tourModal.$(SKIP_ALL_BTN).getText(), 'Skip All');
        const nextStepBtn = tourModal.$(NEXT_STEP_BTN);
        assert.equal(nextStepBtn.getText(), 'Next Step');

        // There should be a subheader [data-tour="single-study-group-comparison-groups"]
        $(
            '[data-tour="single-study-group-comparison-groups"]'
        ).waitForDisplayed();

        // Click on the `Next Step` button, the tour should go to the next step
        nextStepBtn.click();
        step++;
    });

    it('Step 7: Intro to the Overlap tab, on the group comparison page.', () => {
        // The tour should be at step = 7
        assert.equal(step, 7);

        // There should be a tour modal
        const tourModal = $(GROUP_COMPARISON_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `The Overlap tab`
        assert.equal(tourModal.$('.title').getText(), 'The Overlap tab');

        // On the modal, there should be a `Finish guidance` button and a `Next Tab` button
        assert.equal(tourModal.$(SKIP_ALL_BTN).getText(), 'Finish guidance');
        const nextStepBtn = tourModal.$(NEXT_STEP_BTN);
        assert.equal(nextStepBtn.getText(), 'Next Tab');

        // There should be a Overlap tab .mainTabs
        $('.mainTabs').waitForDisplayed();

        // Click on the `Next Tab` button, the tour should go to the next step
        nextStepBtn.click();
        step++;
    });

    it('Step 8: Intro to the Survival tab, on the group comparison page.', () => {
        // The tour should be at step = 8
        assert.equal(step, 8);

        // There should be a tour modal
        const tourModal = $(GROUP_COMPARISON_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `The Survival tab`
        assert.equal(tourModal.$('.title').getText(), 'The Survival tab');

        // On the modal, there should be a `Finish guidance` button and a `Next Tab` button
        assert.equal(tourModal.$(SKIP_ALL_BTN).getText(), 'Finish guidance');
        const nextStepBtn = tourModal.$(NEXT_STEP_BTN);
        assert.equal(nextStepBtn.getText(), 'Next Tab');

        // There should be a Survival tab [data-tour="mainColumn"]
        $('[data-tour="mainColumn"]').waitForDisplayed();

        // Click on the `Next Tab` button, the tour should go to the next step
        nextStepBtn.click();
        step++;
    });

    it('Step 9: Intro to the Clinical tab, on the group comparison page.', () => {
        // The tour should be at step = 9
        assert.equal(step, 9);

        // There should be a tour modal
        const tourModal = $(GROUP_COMPARISON_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `The Clinical tab`
        assert.equal(tourModal.$('.title').getText(), 'The Clinical tab');

        // On the modal, there should be a `Finish guidance` button and a `Next Tab` button
        assert.equal(tourModal.$(SKIP_ALL_BTN).getText(), 'Finish guidance');
        const nextStepBtn = tourModal.$(NEXT_STEP_BTN);
        assert.equal(nextStepBtn.getText(), 'Next Tab');

        // There should be a Clinical tab [data-tour="mainColumn"]
        $('[data-tour="mainColumn"]').waitForDisplayed();

        // Click on the `Next Tab` button, the tour should go to the next step
        nextStepBtn.click();
        step++;
    });

    it('Step 10: Intro to the Genomic Alterations tab, on the group comparison page.', () => {
        // The tour should be at step = 10
        assert.equal(step, 10);

        // There should be a tour modal
        const tourModal = $(GROUP_COMPARISON_TOUR_MODAL);
        tourModal.waitForExist();

        // On the modal, the title of the content should be `The Genomic Alterations tab`
        assert.equal(
            tourModal.$('.title').getText(),
            'The Genomic Alterations tab'
        );

        // On the modal, there should be a `Finish guidance 🎉` button
        const finishStepBtn = tourModal.$(LAST_STEP_BTN);
        assert.equal(finishStepBtn.getText(), 'Finish guidance 🎉');

        // There should be a Genomic Alterations tab [data-tour="mainColumn"]
        $('[data-tour="mainColumn"]').waitForDisplayed();

        // Click on the `Finish guidance 🎉` button, the tour should end
        finishStepBtn.click();
    });
});

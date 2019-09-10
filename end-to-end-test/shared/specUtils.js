const clipboardy = require('clipboardy');

function waitForStudyQueryPage(timeout) {
    $('div[data-test="cancerTypeListContainer"]').waitForExist(timeout || 10000);
}

function waitForGeneQueryPage(timeout) {
    // wait until fade effect on studyList has finished (if running in forkedMode)
    $("[data-test=studyList]").waitForExist(timeout, true);
    $('div[data-test="molecularProfileSelector"]').waitForExist(timeout || 10000);
}

function waitForPlotsTab(timeout) {
    $('div.axisBlock').waitForVisible(timeout || 20000);
}

function waitForCoExpressionTab(timeout) {
    $('//*[@id="coexpressionTabGeneTabs"]').waitForExist(timeout || 20000);
}

function waitForOncoprint(timeout) {
    browser.pause(100); // give oncoprint time to disappear
    browser.waitUntil(()=>{
        return !browser.isExisting(".oncoprintLoadingIndicator") // wait for loading indicator to hide, and
            && browser.isExisting('#oncoprintDiv svg rect')// as a proxy for oncoprint being rendered, wait for an svg rectangle to appear in the legend
            && (browser.getCssProperty(".oncoprintContainer", "opacity").value === 1); // oncoprint has faded in
    }, timeout);
}

function getTextInOncoprintLegend() {
    return browser.getText("#oncoprintDiv .oncoprint-legend-div svg");
}

function setOncoprintMutationsMenuOpen(open) {
    const mutationColorMenuButton = "#mutationColorDropdown";
    const mutationColorMenuDropdown = "div.oncoprint__controls__mutation_color_menu";
    browser.moveToObject("div.oncoprint__controls");
    browser.waitForVisible(mutationColorMenuButton);
    browser.waitUntil(()=>{
        if (open === browser.isVisible(mutationColorMenuDropdown)) {
            return true;
        } else {
            browser.click(mutationColorMenuButton);
            return false;
        }
    }, 10000, `Couldn't ${open ? "open" : "close"} Mutations menu in Oncoprint`, 2000);
}

function goToUrlAndSetLocalStorage(url) {
    if (!useExternalFrontend) {
        browser.url(url);
    } else {
        var urlparam = useLocalDist? 'localdist' : 'localdev';
        var prefix = (url.indexOf("?") > 0)? '&' : '?';
        browser.url(`${url}${prefix}${urlparam}=true`);
    }
    browser.setViewportSize({ height: 1600, width: 1000 });

    // move mouse out of the way
    browser.moveToObject("body", 0, 0);
}

function sessionServiceIsEnabled() {
    return browser.execute(function() {
        return window.frontendConfig.serverConfig.sessionServiceEnabled;
    }).value;
}

function waitForNumberOfStudyCheckboxes(expectedNumber, text) {
    browser.waitUntil(()=>{
        var ret = browser.elements('[data-test="cancerTypeListContainer"] > ul > ul').value.length === expectedNumber;
        if (text && ret) {
            ret = browser.isExisting('[data-test="cancerTypeListContainer"] > ul > ul > ul > li:nth-child(2) > label > span');
            if (ret) {
                ret = (browser.getText('[data-test="cancerTypeListContainer"] > ul > ul > ul > li:nth-child(2) > label > span') === text);
            }
        }
        return ret;
    }, 60000);
}

function getNthOncoprintTrackOptionsElements(n) {
    // n is one-indexed

    const button_selector = "#oncoprintDiv .oncoprintjs__track_options__toggle_btn_img.nth-"+n;
    const dropdown_selector = "#oncoprintDiv .oncoprintjs__track_options__dropdown.nth-"+n;

    return {
        button: $(button_selector),
        button_selector,
        dropdown: $(dropdown_selector),
        dropdown_selector
    };
}


const useExternalFrontend = !process.env.FRONTEND_TEST_DO_NOT_LOAD_EXTERNAL_FRONTEND;

const useLocalDist = process.env.FRONTEND_TEST_USE_LOCAL_DIST;

function waitForNetworkQuiet(timeout){
    browser.waitUntil(()=>{
        return browser.execute(function(){
            return window.ajaxQuiet === true;
        }).value == true
    }, timeout);
}

function toStudyViewSummaryTab() {
    var summaryTab = "#studyViewTabs a.tabAnchor_summary";
    var summaryContent = "[data-test='summary-tab-content']";
    if (!browser.isVisible(summaryContent)) {
        browser.waitForVisible(summaryTab, 10000);
        browser.click(summaryTab);
        browser.waitForVisible(summaryContent, 10000);
    }
}

function toStudyViewClinicalDataTab() {
    var clinicalDataTab = "#studyViewTabs a.tabAnchor_clinicalData";
    var clinicalDataContent = "[data-test='clinical-data-tab-content']";
    if (!browser.isVisible(clinicalDataContent)) {
        browser.waitForVisible(clinicalDataTab, 10000);
        browser.click(clinicalDataTab);
        browser.waitForVisible(clinicalDataContent, 10000);
    }
}

function removeAllStudyViewFilters() {
    const clearAllFilter = "[data-test='clear-all-filters']";
    if (browser.isVisible(clearAllFilter)) {
        browser.click(clearAllFilter);
    }
}

function waitForStudyViewSelectedInfo() {
    browser.waitForVisible("[data-test='selected-info']", 5000);
    // pause to wait the animation finished
    browser.pause(2000);
}

function getTextFromElement(element) {
    return browser.element(element).getText().trim();
}


function getNumberOfStudyViewCharts() {
    return browser.elements('div.react-grid-item').value.length;
}

function setInputText(selector, text){
    browser.setValue(selector, '\uE003'.repeat(browser.getValue(selector).length) + text);
}

function getReactSelectOptions(parent) {
    parent.$('.Select-control').click();
    return parent.$$('.Select-option');
}

function selectReactSelectOption(parent, optionText) {
    reactSelectOption(parent, optionText).click();
}

function reactSelectOption(parent, optionText, loose = false) {
    parent.$('.Select-control').click();
    if (loose) {
        return  parent.$('.Select-option*='+optionText);
    }
    return parent.$('.Select-option='+optionText);
}

function pasteToElement(elementSelector, text){

    clipboardy.writeSync(text);
    browser.setValue(elementSelector, ["Shift","Insert"]);

}

function checkOncoprintElement(selector) {
    browser.execute(function() {
        frontendOnc.clearMouseOverEffects(); // clear mouse hover effects for uniform screenshot
    });
    return browser.checkElement(selector || "#oncoprintDiv", { hide:[".qtip", '.dropdown-menu', ".oncoprintjs__track_options__dropdown", ".oncoprintjs__cell_overlay_div"] });
}

function executeInBrowser(callback){
    return browser.execute(callback).value;
}

function checkElementWithTemporaryClass(selectorForChecking, selectorForTemporaryClass, temporaryClass, pauseTime) {
    browser.execute(function(selectorForTemporaryClass, temporaryClass){
        $(selectorForTemporaryClass).addClass(temporaryClass);
    }, selectorForTemporaryClass, temporaryClass);
    browser.pause(pauseTime);
    var res = browser.checkElement(selectorForChecking);
    browser.execute(function(selectorForTemporaryClass, temporaryClass){
        $(selectorForTemporaryClass).removeClass(temporaryClass);
    }, selectorForTemporaryClass, temporaryClass);
    return res;
}

function checkElementWithMouseDisabled(selector, pauseTime) {
    return checkElementWithTemporaryClass(selector, selector, "disablePointerEvents", pauseTime || 0);
}

function clickQueryByGeneButton(){
    browser.waitForEnabled('a=Query By Gene');
    browser.click('a=Query By Gene');
    browser.scroll(0,0);
};

function clickModifyStudySelectionButton (){
    browser.click('[data-test="modifyStudySelectionButton"]');
}

module.exports = {
    waitForPlotsTab: waitForPlotsTab,
    waitForStudyQueryPage: waitForStudyQueryPage,
    waitForGeneQueryPage: waitForGeneQueryPage,
    waitForOncoprint: waitForOncoprint,
    waitForCoExpressionTab: waitForCoExpressionTab,
    goToUrlAndSetLocalStorage: goToUrlAndSetLocalStorage,
    useExternalFrontend: useExternalFrontend,
    sessionServiceIsEnabled: sessionServiceIsEnabled,
    waitForNumberOfStudyCheckboxes: waitForNumberOfStudyCheckboxes,
    waitForNetworkQuiet:waitForNetworkQuiet,
    getTextInOncoprintLegend: getTextInOncoprintLegend,
    toStudyViewSummaryTab: toStudyViewSummaryTab,
    toStudyViewClinicalDataTab: toStudyViewClinicalDataTab,
    removeAllStudyViewFilters: removeAllStudyViewFilters,
    waitForStudyViewSelectedInfo: waitForStudyViewSelectedInfo,
    getTextFromElement: getTextFromElement,
    getNumberOfStudyViewCharts: getNumberOfStudyViewCharts,
    setOncoprintMutationsMenuOpen: setOncoprintMutationsMenuOpen,
    getNthOncoprintTrackOptionsElements: getNthOncoprintTrackOptionsElements,
    setInputText: setInputText,
    pasteToElement: pasteToElement,
    checkOncoprintElement: checkOncoprintElement,
    executeInBrowser: executeInBrowser,
    checkElementWithTemporaryClass: checkElementWithTemporaryClass,
    checkElementWithMouseDisabled: checkElementWithMouseDisabled,
    clickQueryByGeneButton:clickQueryByGeneButton,
    clickModifyStudySelectionButton: clickModifyStudySelectionButton,
    selectReactSelectOption: selectReactSelectOption,
    reactSelectOption: reactSelectOption,
    getReactSelectOptions: getReactSelectOptions,
    COEXPRESSION_TIMEOUT: 120000
};

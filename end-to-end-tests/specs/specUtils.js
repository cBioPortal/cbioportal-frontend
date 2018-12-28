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
    }, 2000);
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

function waitForNetworkQuiet(){
    browser.waitUntil(()=>{
        return browser.execute(function(){
            return window.ajaxQuiet === true;
        }).value == true
    });
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

module.exports = {
    waitForOncoprint: waitForOncoprint,
    goToUrlAndSetLocalStorage: goToUrlAndSetLocalStorage,
    useExternalFrontend: useExternalFrontend,
    sessionServiceIsEnabled: sessionServiceIsEnabled,
    waitForNumberOfStudyCheckboxes: waitForNumberOfStudyCheckboxes,
    waitForNetworkQuiet:waitForNetworkQuiet,
    getTextInOncoprintLegend: getTextInOncoprintLegend,
    toStudyViewSummaryTab: toStudyViewSummaryTab,
    toStudyViewClinicalDataTab: toStudyViewClinicalDataTab,
    waitForStudyViewSelectedInfo: waitForStudyViewSelectedInfo,
    getTextFromElement: getTextFromElement,
    getNumberOfStudyViewCharts: getNumberOfStudyViewCharts,
    setOncoprintMutationsMenuOpen: setOncoprintMutationsMenuOpen,
    getNthOncoprintTrackOptionsElements: getNthOncoprintTrackOptionsElements
};

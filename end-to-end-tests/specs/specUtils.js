function waitForOncoprint(timeout) {
    browser.pause(100); // give oncoprint time to disappear
    browser.waitUntil(()=>{
        return !browser.isExisting(".oncoprintLoadingIndicator") // wait for loading indicator to hide, and
            && browser.isExisting('#oncoprintDiv svg rect');// as a proxy for oncoprint being rendered, wait for an svg rectangle to appear in the legend
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

const useExternalFrontend = !process.env.FRONTEND_TEST_DO_NOT_LOAD_EXTERNAL_FRONTEND;

const useLocalDist = process.env.FRONTEND_TEST_USE_LOCAL_DIST;

function waitForNetworkQuiet(){
    browser.waitUntil(()=>{
        return browser.execute(function(){
            return window.ajaxQuiet === true;
        }).value == true
    });
}



module.exports = {
    waitForOncoprint: waitForOncoprint,
    goToUrlAndSetLocalStorage: goToUrlAndSetLocalStorage,
    useExternalFrontend: useExternalFrontend,
    sessionServiceIsEnabled: sessionServiceIsEnabled,
    waitForNumberOfStudyCheckboxes: waitForNumberOfStudyCheckboxes,
    waitForNetworkQuiet:waitForNetworkQuiet,
    getTextInOncoprintLegend: getTextInOncoprintLegend,
    setOncoprintMutationsMenuOpen: setOncoprintMutationsMenuOpen
};

function waitForOncoprint(timeout) {
    browser.pause(100); // give oncoprint time to disappear
    browser.waitForExist('#oncoprintDiv svg rect', timeout); // as a proxy for oncoprint being rendered, wait for an svg rectangle to appear in the legend
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

module.exports = {
    waitForOncoprint: waitForOncoprint,
    goToUrlAndSetLocalStorage: goToUrlAndSetLocalStorage,
    useExternalFrontend: useExternalFrontend,
    sessionServiceIsEnabled: sessionServiceIsEnabled,
    waitForNumberOfStudyCheckboxes: waitForNumberOfStudyCheckboxes
};

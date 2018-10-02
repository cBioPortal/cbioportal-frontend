function waitForOncoprint(timeout) {
    browser.pause(100); // give oncoprint time to disappear
    browser.waitForExist('#oncoprintDiv svg rect', timeout); // as a proxy for oncoprint being rendered, wait for an svg rectangle to appear in the legend
}

function goToUrlAndSetLocalStorage(url) {
    browser.url(url);
    browser.localStorage("DELETE");
    if (useExternalFrontend) {
        browser.localStorage("POST", {key: "localdev", value: "true"});
    }
    browser.refresh();
}

function sessionServiceIsEnabled() {
    return browser.execute(function() {
        return window.frontendConfig.sessionServiceIsEnabled;
    }).value;
}

const useExternalFrontend = !process.env.FRONTEND_TEST_DO_NOT_LOAD_EXTERNAL_FRONTEND;

const useLocalDist = process.env.FRONTEND_TEST_USE_LOCAL_DIST;

module.exports = {
    waitForOncoprint: waitForOncoprint,
    goToUrlAndSetLocalStorage: goToUrlAndSetLocalStorage,
    useExternalFrontend: useExternalFrontend,
    sessionServiceIsEnabled: sessionServiceIsEnabled
};

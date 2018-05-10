function waitForOncoprint(timeout) {
    browser.pause(100); // give oncoprint time to disappear
    browser.waitForExist('#oncoprint-inner svg rect', timeout); // as a proxy for oncoprint being rendered, wait for an svg rectangle to appear in the legend
}

function goToUrlAndSetLocalStorage(url) {
    if (!useExternalFrontend) {
        browser.url(url);
    } else {
        var urlparam = useLocalDist? 'localdist' : 'localdev';
        var prefix = (url.indexOf("?") > 0)? '&' : '?';
        browser.url(`${url}${prefix}${urlparam}=true`);
    }
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

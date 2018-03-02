function waitForOncoprint(timeout) {
    browser.pause(100); // give oncoprint time to disappear
    browser.waitForExist('#oncoprint-inner svg rect', timeout); // as a proxy for oncoprint being rendered, wait for an svg rectangle to appear in the legend
}

function goToUrlAndSetLocalStorage(url) {
    browser.url(url);
    browser.localStorage('DELETE');
    if (useExternalFrontend) {
        browser.localStorage('POST', {key: 'localdev', value: 'true'});
    }
    browser.refresh();
}

const useExternalFrontend = !process.env.FRONTEND_TEST_DO_NOT_LOAD_EXTERNAL_FRONTEND;

module.exports = {
    waitForOncoprint: waitForOncoprint,
    goToUrlAndSetLocalStorage: goToUrlAndSetLocalStorage,
    useExternalFrontend: useExternalFrontend
};

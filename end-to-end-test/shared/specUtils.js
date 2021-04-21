const clipboardy = require('clipboardy');

function waitForStudyQueryPage(timeout) {
    $('div[data-test="cancerTypeListContainer"]').waitForExist(
        timeout || 10000
    );
}

function waitForGeneQueryPage(timeout) {
    // wait until fade effect on studyList has finished (if running in forkedMode)
    $('[data-test=studyList]').waitForExist(timeout, true);
    $('div[data-test="molecularProfileSelector"]').waitForExist(
        timeout || 10000
    );
}

function waitForPlotsTab(timeout) {
    $('div.axisBlock').waitForDisplayed(timeout || 20000);
}

function waitForCoExpressionTab(timeout) {
    $('#coexpressionTabGeneTabs').waitForExist(timeout || 20000);
}

function waitForPatientView(timeout) {
    $('#patientViewPageTabs').waitForExist(timeout || 20000);
    $('[data-test=patientview-copynumber-table]').waitForDisplayed(
        timeout || 20000
    );
    $('[data-test=patientview-mutation-table]').waitForDisplayed(
        timeout || 20000
    );
}

function waitForOncoprint(timeout) {
    browser.pause(100); // give oncoprint time to disappear
    browser.waitUntil(() => {
        return (
            !$('.oncoprintLoadingIndicator').isExisting() && // wait for loading indicator to hide, and
            $('#oncoprintDiv svg rect').isExisting() && // as a proxy for oncoprint being rendered, wait for an svg rectangle to appear in the legend
            $('.oncoprintContainer').getCSSProperty('opacity').value === 1 && // oncoprint has faded in
            $('.oncoprint__controls').isExisting()
        ); // oncoprint controls are showing
    }, timeout);
}

function getTextInOncoprintLegend() {
    return browser.getText('#oncoprintDiv .oncoprint-legend-div svg');
}

function setResultsPageSettingsMenuOpen(open) {
    const button = 'button[data-test="GlobalSettingsButton"]';
    const dropdown = 'div[data-test="GlobalSettingsDropdown"]';
    $(button).waitForDisplayed();
    browser.waitUntil(
        () => {
            if (open === $(dropdown).isDisplayed()) {
                return true;
            } else {
                $(button).click();
                return false;
            }
        },
        10000,
        `Couldn't ${open ? 'open' : 'close'} results page settings menu`,
        2000
    );
}

function setOncoprintMutationsMenuOpen(open) {
    const mutationColorMenuButton = '#mutationColorDropdown';
    const mutationColorMenuDropdown =
        'div.oncoprint__controls__mutation_color_menu';
    $('div.oncoprint__controls').moveTo();
    $(mutationColorMenuButton).waitForDisplayed();
    browser.waitUntil(
        () => {
            if (open === $(mutationColorMenuDropdown).isDisplayed()) {
                return true;
            } else {
                $(mutationColorMenuButton).click();
                return false;
            }
        },
        10000,
        `Couldn't ${open ? 'open' : 'close'} Mutations menu in Oncoprint`,
        2000
    );
}

function setDropdownOpen(
    open,
    button_selector,
    dropdown_selector,
    failure_message
) {
    browser.waitUntil(
        () => {
            // check if exists first because sometimes we get errors with isVisible if it doesn't exist
            const isOpen = $(dropdown_selector).isExisting()
                ? $(dropdown_selector).isDisplayed()
                : false;
            if (open === isOpen) {
                return true;
            } else {
                $(button_selector).click();
                return false;
            }
        },
        10000,
        failure_message,
        2000
    );
}

function goToUrlAndSetLocalStorage(url, authenticated = false) {
    const currentUrl = browser.getUrl();
    const needToLogin =
        authenticated && (!currentUrl || !currentUrl.includes('http'));
    if (!useExternalFrontend) {
        browser.url(url);
        console.log('Connecting to: ' + url);
    } else {
        var urlparam = useLocalDist ? 'localdist' : 'localdev';
        var prefix = url.indexOf('?') > 0 ? '&' : '?';
        browser.url(`${url}${prefix}${urlparam}=true`);
        console.log('Connecting to: ' + `${url}${prefix}${urlparam}=true`);
    }
    if (needToLogin) keycloakLogin();

    //browser.setViewportSize({ height: 1000, width: 1600 });

    // move mouse out of the way
    //browser.moveToObject('body', 0, 0);
}

function sessionServiceIsEnabled() {
    return browser.execute(function() {
        return window.frontendConfig.serverConfig.sessionServiceEnabled;
    }).value;
}

function showGsva() {
    browser.execute(function() {
        window.frontendConfig.serverConfig.skin_show_gsva = true;
    });
}

function waitForNumberOfStudyCheckboxes(expectedNumber, text) {
    browser.waitUntil(() => {
        var ret =
            $$('[data-test="cancerTypeListContainer"] > ul > ul').length ===
            expectedNumber;
        if (text && ret) {
            ret = $(
                '[data-test="cancerTypeListContainer"] > ul > ul > ul > li:nth-child(2) > label > span'
            ).isExisting();
            if (ret) {
                ret =
                    $(
                        '[data-test="cancerTypeListContainer"] > ul > ul > ul > li:nth-child(2) > label > span'
                    ).getText() === text;
            }
        }
        return ret;
    }, 60000);
}

function getNthOncoprintTrackOptionsElements(n) {
    // n is one-indexed

    const button_selector =
        '#oncoprintDiv .oncoprintjs__track_options__toggle_btn_img.nth-' + n;
    const dropdown_selector =
        '#oncoprintDiv .oncoprintjs__track_options__dropdown.nth-' + n;

    return {
        button: $(button_selector),
        button_selector,
        dropdown: $(dropdown_selector),
        dropdown_selector,
    };
}

const useExternalFrontend = !process.env
    .FRONTEND_TEST_DO_NOT_LOAD_EXTERNAL_FRONTEND;

const useLocalDist = process.env.FRONTEND_TEST_USE_LOCAL_DIST;

function waitForNetworkQuiet(timeout) {
    browser.waitUntil(() => {
        return (
            browser.execute(function() {
                return window.ajaxQuiet === true;
            }) == true
        );
    }, timeout);
}

function getPortalUrlFromEnv() {
    return process.env.CBIOPORTAL_URL.replace(/\/$/, '');
}

function toStudyViewSummaryTab() {
    var summaryTab = '#studyViewTabs a.tabAnchor_summary';
    var summaryContent = "[data-test='summary-tab-content']";
    if (!$(summaryContent).isDisplayed()) {
        $(summaryTab).waitForDisplayed({ timeout: 10000 });
        $(summaryTab).click();
        $(summaryContent).waitForDisplayed({ timeout: 10000 });
    }
}

function toStudyViewClinicalDataTab() {
    var clinicalDataTab = '#studyViewTabs a.tabAnchor_clinicalData';
    var clinicalDataContent = "[data-test='clinical-data-tab-content']";
    if (!$(clinicalDataContent).isDisplayed()) {
        $(clinicalDataTab).waitForDisplayed({ timeout: 10000 });
        $(clinicalDataTab).click();
        $(clinicalDataContent).waitForDisplayed({ timeout: 10000 });
    }
}

function removeAllStudyViewFilters() {
    const clearAllFilter = "[data-test='clear-all-filters']";
    if ($(clearAllFilter).isDisplayed()) {
        $(clearAllFilter).click();
    }
}

function waitForStudyViewSelectedInfo() {
    $("[data-test='selected-info']").waitForDisplayed({ timeout: 5000 });
    // pause to wait the animation finished
    browser.pause(2000);
}

function waitForStudyView() {
    browser.waitUntil(() => $$('.sk-spinner').length === 0, { timeout: 10000 });
}

function waitForGroupComparisonTabOpen() {
    $('[data-test=ComparisonPageOverlapTabDiv]').waitForDisplayed({
        timeout: 100000,
    });
}

function getTextFromElement(element) {
    return $(element)
        .getText()
        .trim();
}

function getNumberOfStudyViewCharts() {
    return $$('div.react-grid-item').length;
}

function setInputText(selector, text) {
    $(selector).setValue('\uE003'.repeat($(selector).getValue().length) + text);
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
        return parent.$('.Select-option*=' + optionText);
    }
    return parent.$('.Select-option=' + optionText);
}

function selectCheckedOption(parent, optionText, loose = false) {
    parent.$('.default-checked-select').click();
    if (loose) {
        return parent.$('.checked-select-option*=' + optionText);
    }
    return parent.$('.checked-select-option=' + optionText);
}

function getSelectCheckedOptions(parent) {
    parent.$('.default-checked-select').click();
    return parent.$$('.checked-select-option');
}

function pasteToElement(elementSelector, text) {
    clipboardy.writeSync(text);
    $(elementSelector).setValue(['Shift', 'Insert']);
}

function checkOncoprintElement(selector) {
    //browser.moveToObject('body', 0, 0);
    browser.execute(function() {
        frontendOnc.clearMouseOverEffects(); // clear mouse hover effects for uniform screenshot
    });
    return checkElementWithMouseDisabled(selector || '#oncoprintDiv', 0, {
        hide: [
            '.qtip',
            '.dropdown-menu',
            '.oncoprintjs__track_options__dropdown',
            '.oncoprintjs__cell_overlay_div',
        ],
    });
}

function executeInBrowser(callback) {
    return browser.execute(callback);
}

function checkElementWithTemporaryClass(
    selectorForChecking,
    selectorForTemporaryClass,
    temporaryClass,
    pauseTime,
    options
) {
    browser.execute(
        function(selectorForTemporaryClass, temporaryClass) {
            $(selectorForTemporaryClass).addClass(temporaryClass);
        },
        selectorForTemporaryClass,
        temporaryClass
    );
    browser.pause(pauseTime);
    var res = browser.checkElement(selectorForChecking, options);
    browser.execute(
        function(selectorForTemporaryClass, temporaryClass) {
            $(selectorForTemporaryClass).removeClass(temporaryClass);
        },
        selectorForTemporaryClass,
        temporaryClass
    );
    return res;
}

function checkElementWithMouseDisabled(selector, pauseTime, options) {
    browser.execute(function() {
        const style = 'display:block !important;visibility:visible !important;';
        $(`<div id='blockUIToDisableMouse' style='${style}'></div>`).appendTo(
            'body'
        );
    });

    const ret = checkElementWithTemporaryClass(
        selector,
        selector,
        'disablePointerEvents',
        pauseTime || 0,
        options
    );

    browser.execute(function() {
        $('#blockUIToDisableMouse').remove();
    });

    return ret;
}

function checkElementWithElementHidden(selector, selectorToHide, options) {
    browser.execute(selectorToHide => {
        $(
            `<style id="tempHiddenStyles" type="text/css">${selectorToHide}{opacity:0;}</style>`
        ).appendTo('head');
    }, selectorToHide);

    var res = browser.checkElement(selector, options);

    browser.execute(selectorToHide => {
        $('#tempHiddenStyles').remove();
    }, selectorToHide);

    return res;
}

function clickQueryByGeneButton() {
    $('a=Query By Gene').waitForEnabled();
    $('a=Query By Gene').click();
    $('body').scrollIntoView();
}

function clickModifyStudySelectionButton() {
    $('[data-test="modifyStudySelectionButton"]').click();
}

function getOncoprintGroupHeaderOptionsElements(trackGroupIndex) {
    //trackGroupIndex is 0-indexed

    const button_selector =
        '#oncoprintDiv .oncoprintjs__header__toggle_btn_img.track-group-' +
        trackGroupIndex;
    const dropdown_selector =
        '#oncoprintDiv .oncoprintjs__header__dropdown.track-group-' +
        trackGroupIndex;

    return {
        button: $(button_selector),
        button_selector,
        dropdown: $(dropdown_selector),
        dropdown_selector,
    };
}

function postDataToUrl(url, data, authenticated = true) {
    const currentUrl = browser.getUrl();
    const needToLogin =
        authenticated && (!currentUrl || !currentUrl.includes('http'));
    browser.execute(
        (url, data) => {
            function formSubmit(url, params) {
                // method="smart" means submit with GET iff the URL wouldn't be too long

                const form = document.createElement('form');
                form.setAttribute('method', 'post');
                form.setAttribute('action', url);
                form.setAttribute('target', '_self');

                for (const key of Object.keys(params)) {
                    const hiddenField = document.createElement('input');
                    hiddenField.setAttribute('type', 'hidden');
                    hiddenField.setAttribute('name', key);
                    hiddenField.setAttribute('value', params[key]);
                    form.appendChild(hiddenField);
                }

                document.body.appendChild(form);
                form.submit();
            }

            formSubmit(url, data);
        },
        url,
        data
    );
    if (needToLogin) keycloakLogin();
}

function keycloakLogin(timeout) {
    browser.waitUntil(
        () => browser.getUrl().includes('/auth/realms/cbio'),
        timeout,
        'No redirect to Keycloak could be detected.'
    );
    $('body').waitForDisplayed(timeout);

    $('#username').setValue('testuser');
    $('#password').setValue('P@ssword1');
    $('#kc-login').click();

    browser.waitUntil(() => !browser.getUrl().includes('/auth/realms/cbio'));
    $('body').waitForDisplayed(timeout);
}

function openGroupComparison(studyViewUrl, chartDataTest, timeout) {
    goToUrlAndSetLocalStorage(studyViewUrl, true);
    $('[data-test=summary-tab-content]').waitForDisplayed();
    waitForNetworkQuiet();
    const chart = '[data-test=' + chartDataTest + ']';
    $(chart).waitForDisplayed({ timeout: timeout || 10000 });
    $(chart).moveTo();
    browser.waitUntil(
        () => {
            return $(chart + ' .controls').isExisting();
        },
        { timeout: timeout || 10000 }
    );

    // move to hamburger icon
    const hamburgerIcon = '[data-test=chart-header-hamburger-icon]';
    $(hamburgerIcon).moveTo();

    // wait for the menu available
    $(hamburgerIcon).waitForDisplayed({ timeout: timeout || 10000 });

    // open comparison session
    const studyViewTabId = browser.getWindowHandle();
    $(chart)
        .$(hamburgerIcon)
        .$$('li')[1]
        .click();
    const groupComparisonTabId = browser
        .getWindowHandles()
        .filter(id => id !== studyViewTabId)[0];
    browser.switchToWindow(groupComparisonTabId);
    waitForGroupComparisonTabOpen();
}

function selectElementByText(text) {
    return $(`//*[text()="${text}"]`);
}

module.exports = {
    checkElementWithElementHidden: checkElementWithElementHidden,
    waitForPlotsTab: waitForPlotsTab,
    waitForStudyQueryPage: waitForStudyQueryPage,
    waitForGeneQueryPage: waitForGeneQueryPage,
    waitForOncoprint: waitForOncoprint,
    waitForCoExpressionTab: waitForCoExpressionTab,
    waitForPatientView: waitForPatientView,
    goToUrlAndSetLocalStorage: goToUrlAndSetLocalStorage,
    useExternalFrontend: useExternalFrontend,
    sessionServiceIsEnabled: sessionServiceIsEnabled,
    waitForNumberOfStudyCheckboxes: waitForNumberOfStudyCheckboxes,
    waitForNetworkQuiet: waitForNetworkQuiet,
    getTextInOncoprintLegend: getTextInOncoprintLegend,
    toStudyViewSummaryTab: toStudyViewSummaryTab,
    toStudyViewClinicalDataTab: toStudyViewClinicalDataTab,
    removeAllStudyViewFilters: removeAllStudyViewFilters,
    waitForStudyViewSelectedInfo: waitForStudyViewSelectedInfo,
    waitForStudyView: waitForStudyView,
    waitForGroupComparisonTabOpen: waitForGroupComparisonTabOpen,
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
    clickQueryByGeneButton: clickQueryByGeneButton,
    clickModifyStudySelectionButton: clickModifyStudySelectionButton,
    selectReactSelectOption: selectReactSelectOption,
    reactSelectOption: reactSelectOption,
    getReactSelectOptions: getReactSelectOptions,
    COEXPRESSION_TIMEOUT: 120000,
    getSelectCheckedOptions: getSelectCheckedOptions,
    selectCheckedOption: selectCheckedOption,
    getOncoprintGroupHeaderOptionsElements: getOncoprintGroupHeaderOptionsElements,
    showGsva: showGsva,
    setResultsPageSettingsMenuOpen: setResultsPageSettingsMenuOpen,
    setDropdownOpen: setDropdownOpen,
    postDataToUrl: postDataToUrl,
    getPortalUrlFromEnv: getPortalUrlFromEnv,
    openGroupComparison: openGroupComparison,
    selectElementByText: selectElementByText,
};

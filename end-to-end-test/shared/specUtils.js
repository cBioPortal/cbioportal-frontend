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
    $('div.axisBlock').waitForVisible(timeout || 20000);
}

function waitForCoExpressionTab(timeout) {
    $('#coexpressionTabGeneTabs').waitForExist(timeout || 20000);
}

function waitForPatientView(timeout) {
    $('#patientViewPageTabs').waitForExist(timeout || 20000);
    $('[data-test=patientview-copynumber-table]').waitForVisible(
        timeout || 20000
    );
    $('[data-test=patientview-mutation-table]').waitForVisible(
        timeout || 20000
    );
}

function waitForOncoprint(timeout) {
    browser.pause(100); // give oncoprint time to disappear
    browser.waitUntil(() => {
        return (
            !browser.isExisting('.oncoprintLoadingIndicator') && // wait for loading indicator to hide, and
            browser.isExisting('#oncoprintDiv svg rect') && // as a proxy for oncoprint being rendered, wait for an svg rectangle to appear in the legend
            browser.getCssProperty('.oncoprintContainer', 'opacity').value ===
                1 && // oncoprint has faded in
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
    browser.waitForVisible(button);
    browser.waitUntil(
        () => {
            if (open === browser.isVisible(dropdown)) {
                return true;
            } else {
                browser.click(button);
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
    browser.moveToObject('div.oncoprint__controls');
    browser.waitForVisible(mutationColorMenuButton);
    browser.waitUntil(
        () => {
            if (open === browser.isVisible(mutationColorMenuDropdown)) {
                return true;
            } else {
                browser.click(mutationColorMenuButton);
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
            const isOpen = browser.isExisting(dropdown_selector)
                ? browser.isVisible(dropdown_selector)
                : false;
            if (open === isOpen) {
                return true;
            } else {
                browser.click(button_selector);
                return false;
            }
        },
        10000,
        failure_message,
        2000
    );
}

function goToUrlAndSetLocalStorage(url) {
    if (!useExternalFrontend) {
        browser.url(url);
    } else {
        var urlparam = useLocalDist ? 'localdist' : 'localdev';
        var prefix = url.indexOf('?') > 0 ? '&' : '?';
        browser.url(`${url}${prefix}${urlparam}=true`);
    }
    browser.setViewportSize({ height: 1600, width: 1000 });

    // move mouse out of the way
    browser.moveToObject('body', 0, 0);
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
            browser.elements('[data-test="cancerTypeListContainer"] > ul > ul')
                .value.length === expectedNumber;
        if (text && ret) {
            ret = browser.isExisting(
                '[data-test="cancerTypeListContainer"] > ul > ul > ul > li:nth-child(2) > label > span'
            );
            if (ret) {
                ret =
                    browser.getText(
                        '[data-test="cancerTypeListContainer"] > ul > ul > ul > li:nth-child(2) > label > span'
                    ) === text;
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
            }).value == true
        );
    }, timeout);
}

function closeDevModeBanner() {
    // Using class name to remove the banner is not ideal. We should add a data-test at the backend repo.
    $('.alert-warning')
        .$('button.close')
        .click();
}

function getPortalUrlFromEnv() {
    return process.env.CBIOPORTAL_URL.replace(/\/$/, '');
}

function toStudyViewSummaryTab() {
    var summaryTab = '#studyViewTabs a.tabAnchor_summary';
    var summaryContent = "[data-test='summary-tab-content']";
    if (!browser.isVisible(summaryContent)) {
        browser.waitForVisible(summaryTab, 10000);
        browser.click(summaryTab);
        browser.waitForVisible(summaryContent, 10000);
    }
}

function toStudyViewClinicalDataTab() {
    var clinicalDataTab = '#studyViewTabs a.tabAnchor_clinicalData';
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
    return browser
        .element(element)
        .getText()
        .trim();
}

function getNumberOfStudyViewCharts() {
    return browser.elements('div.react-grid-item').value.length;
}

function setInputText(selector, text) {
    browser.setValue(
        selector,
        '\uE003'.repeat(browser.getValue(selector).length) + text
    );
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
    browser.setValue(elementSelector, ['Shift', 'Insert']);
}

function checkOncoprintElement(selector) {
    browser.moveToObject('body', 0, 0);
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
    return browser.execute(callback).value;
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
    return checkElementWithTemporaryClass(
        selector,
        selector,
        'disablePointerEvents',
        pauseTime || 0,
        options
    );
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
    browser.waitForEnabled('a=Query By Gene');
    browser.click('a=Query By Gene');
    browser.scroll(0, 0);
}

function clickModifyStudySelectionButton() {
    browser.click('[data-test="modifyStudySelectionButton"]');
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

function postDataToUrl(url, data) {
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
    closeDevModeBanner: closeDevModeBanner,
    getPortalUrlFromEnv: getPortalUrlFromEnv,
};

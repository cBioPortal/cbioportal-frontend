var assert = require('assert');

var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var setServerConfiguration = require('../../../shared/specUtils')
    .setServerConfiguration;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

function customTabBase(location) {
    return [
        {
            title: 'Sync Tab',
            id: 'customTab1',
            location: location,
            mountCallbackName: 'renderCustomTab1',
            hide: false,
            unmountOnHide: false,
        },
        {
            title: 'Async Tab',
            id: 'customTab2',
            location: location,
            mountCallbackName: 'renderCustomTab1',
            hide: false,
            unmountOnHide: false,
            hideAsync: `()=>{
                   return new Promise((resolve)=>{
                        setTimeout(()=>{
                            resolve(true);
                        }, 5000);
                   });
           }`,
        },
    ];
}

function goToUrlWithCustomTabConfig(url, custom_tabs) {
    browser.url(`${CBIOPORTAL_URL}/blank`);
    setServerConfiguration({
        custom_tabs,
    });
    goToUrlAndSetLocalStorage(url);
}

function runTests(pageName, url, tabLocation) {
    describe(`${pageName} Custom Tabs`, () => {
        it.skip('Sync and async hide/show works', function() {
            this.retries(0);

            goToUrlWithCustomTabConfig(url, customTabBase(tabLocation));

            browser.execute(() => {
                window.renderCustomTab1 = function(div, tab) {
                    $(div).append(
                        `<div>this is the content for ${tab.title}</div>`
                    );
                };
            });

            $('.mainTabs').waitForDisplayed();

            assert.equal(
                $('=Async Tab').isDisplayed(),
                false,
                'We do NOT see async tab initially'
            );

            assert($('=Sync Tab').isDisplayed(), 'We see sync tab immediately');

            browser.pause(6000);

            assert(
                $('=Async Tab').isDisplayed(),
                'Async tab displays after pause'
            );

            $('=Sync Tab').click();

            assert($('div=this is the content for Sync Tab').isDisplayed());

            $('=Async Tab').click();

            assert($('div=this is the content for Async Tab').isDisplayed());
        });

        it('Tab page location configuration is obeyed', () => {
            const conf = [
                {
                    title: 'Patient Tab',
                    id: 'customTab1',
                    location: 'SOMETHING_ELSE',
                    mountCallbackName: 'renderCustomTab1',
                    hide: false,
                },
                {
                    title: 'Result Tab',
                    id: 'customTab2',
                    location: tabLocation,
                    mountCallbackName: 'renderCustomTab1',
                    hide: false,
                },
            ];

            goToUrlWithCustomTabConfig(url, conf);

            $('.mainTabs').waitForDisplayed();

            assert.equal(
                $('=Patient Tab').isDisplayed(),
                false,
                'We do NOT see hidden tab'
            );

            assert.equal(
                $('=Result Tab').isDisplayed(),
                true,
                'We do see showing tab'
            );
        });

        it('Hide property indeed hides custom tab', () => {
            const conf = [
                {
                    title: 'Hidden Tab',
                    id: 'customTab1',
                    location: tabLocation,
                    mountCallbackName: 'renderCustomTab1',
                    hide: true,
                    unmountOnHide: false,
                },
                {
                    title: 'Showing Tab',
                    id: 'customTab1',
                    location: tabLocation,
                    mountCallbackName: 'renderCustomTab1',
                    hide: false,
                    unmountOnHide: false,
                },
            ];

            goToUrlWithCustomTabConfig(url, conf);

            $('.mainTabs').waitForDisplayed();

            assert.equal(
                $('=Hidden Tab').isDisplayed(),
                false,
                'We do NOT see hidden tab'
            );

            assert.equal(
                $('=Showing Tab').isDisplayed(),
                true,
                'We do see showing tab'
            );
        });

        it('Routing directly to conditional tab forces it to show', () => {
            const conf = [
                {
                    title: 'Async Tab',
                    id: 'customTab1',
                    location: tabLocation,
                    hideAsync: `()=>{
                           return new Promise((resolve)=>{
                                setTimeout(()=>{
                                    resolve(true);
                                }, 2000);
                           });
                }`,
                },
                {
                    title: 'Async Tab 2',
                    id: 'customTab2',
                    location: tabLocation,
                    hideAsync: `()=>{
                           return new Promise((resolve)=>{
                                setTimeout(()=>{
                                    resolve(true);
                                }, 2000);
                           });
                    }`,
                },
            ];

            goToUrlWithCustomTabConfig(url.replace(/\?/, '/customTab1?'), conf);

            $('.mainTabs').waitForDisplayed();

            // when we are directly routed to tab
            // the navigation tab button DOES show
            // even though hideAsync is still pending
            assert.equal(
                $('=Async Tab').isDisplayed(),
                true,
                'We see pending custom tab button when routed to it'
            );

            assert.equal(
                $('[data-test=LoadingIndicator]').isDisplayed(),
                true,
                'tab loading indicator is showing'
            );

            assert.equal(
                $('=Async Tab 2').isDisplayed(),
                false,
                'We do not see the second custom tab button'
            );
        });

        it('Remounts tab only when tracked url param changes (part of hash in url wrapper)', () => {
            const conf = [
                {
                    title: 'Async Tab',
                    id: 'customTab1',
                    location: tabLocation,
                    hideAsync: `()=>{
                           return new Promise((resolve)=>{
                                setTimeout(()=>{
                                    resolve(true);
                                }, 1000);
                           });
                }`,
                    mountCallbackName: 'renderCustomTab1',
                },
            ];

            goToUrlWithCustomTabConfig(url, conf);

            browser.execute(() => {
                window.renderCustomTab1 = function(div, tab) {
                    $(div).append(`<div>First render</div>`);
                };
            });

            $('=Async Tab').click();

            browser.pause(1000);

            assert($('div=First render').isDisplayed());

            // redefine custom tab render
            // so we can see when it's called
            browser.execute(() => {
                window.renderCustomTab1 = function(div, tab) {
                    $(div).append(`<div>Second render</div>`);
                };
            });

            // switch to new tab and then back
            $$('.mainTabs .tabAnchor')[0].click();
            $('=Async Tab').click();

            // we haven't re-mounted the tab
            assert(
                $('div=First render').isDisplayed() &&
                    !$('div=Second render').isDisplayed(),
                "merely switching tabs didn't call mount function"
            );

            // the following two commands are inteded to trigger
            // remount of MSKTabs and thus remount of custom tab
            // kinda annoying, i know
            switch (tabLocation) {
                case 'RESULTS_PAGE':
                    browser.execute(() => {
                        window.urlWrapper.updateRoute({
                            gene_list: 'BRAF KRAS',
                        });
                    });
                    break;
                case 'PATIENT_PAGE':
                    $('.nextPageBtn').isDisplayed() &&
                        $('.nextPageBtn').click();
                    break;
                case 'COMPARISON_PAGE':
                    $("[data-test='groupSelectorButtonMSI/CIMP']").click();
                    break;
            }

            $('div=Second render').waitForDisplayed();

            assert(
                $('div=Second render').isDisplayed(),
                'changing query causes custom tab to remount'
            );
        });
    });
}

const resultsUrl = `${CBIOPORTAL_URL}/results?cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF`;

const patientUrl = `${CBIOPORTAL_URL}/patient?studyId=ucec_tcga_pub&caseId=TCGA-AP-A053#navCaseIds=ucec_tcga_pub:TCGA-AP-A053,ucec_tcga_pub:TCGA-BG-A0M8,ucec_tcga_pub:TCGA-BG-A0YV,ucec_tcga_pub:TCGA-BS-A0U8`;

const comparisonUrl = `${CBIOPORTAL_URL}/comparison?comparisonId=61845a6ff8f71021ce56e22b`;

describe('Patient Cohort View Custom Tab Tests', () => {
    const conf = [
        {
            title: 'Sync Tab',
            id: 'customTab1',
            location: 'PATIENT_PAGE',
            mountCallback: `(div)=>{
                    $(div).html("tab for patient " + window.location.search.split("=").slice(-1))
                }`,
        },
        {
            title: 'Async Tab',
            id: 'customTab2',
            location: 'PATIENT_PAGE',
            hide: false,
            hideAsync: `()=>{
                           return new Promise((resolve)=>{
                                const int = setInterval(()=>{
                                    if ( $(".tabAnchor_customTab1").length ) {
                                      clearInterval(int)
                                       setTimeout(()=>{
                                            resolve(true);
                                        }, 10000);
                                    }
                                },500);
                           });
                    }`,
        },
    ];

    it('Navigating between patients changes tab contents', function() {
        this.retries(0);

        goToUrlWithCustomTabConfig(patientUrl, conf);

        $('a=Summary').waitForDisplayed();

        const asyncExists = $('a=Async Tab').isExisting();

        if (asyncExists) {
            assert.fail("Async exists when it shouldn't!");
        }

        $('=Sync Tab').click();

        assert.equal(
            $('div=tab for patient TCGA-AP-A053').isDisplayed(),
            true,
            'We first patient'
        );

        browser.pause(11000);

        assert.equal(
            $('=Async Tab').isDisplayed(),
            true,
            'Async tab has showed up'
        );

        $('.nextPageBtn').click();

        $('.mainTabs').waitForDisplayed();

        assert.equal(
            $('=Async Tab').isDisplayed(),
            false,
            'Async is hidden again (pending)'
        );

        assert.equal(
            $('div=tab for patient TCGA-BG-A0M8').isDisplayed(),
            true,
            'We see next patient'
        );

        $('.prevPageBtn').waitForDisplayed();

        $('.prevPageBtn').click();

        $('div=tab for patient TCGA-AP-A053').waitForDisplayed();
    });
});

runTests('ResultsView', resultsUrl, 'RESULTS_PAGE');

runTests('PatientView', patientUrl, 'PATIENT_PAGE');

runTests('ComparisonPage', comparisonUrl, 'COMPARISON_PAGE');

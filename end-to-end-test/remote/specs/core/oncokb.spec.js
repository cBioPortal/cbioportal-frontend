var assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;
var getPortalUrlFromEnv = require('../../../shared/specUtils')
    .getPortalUrlFromEnv;

const CBIOPORTAL_URL = getPortalUrlFromEnv();
const ONCOKB_CARD_DATA_TEST_NAME = 'oncokb-card';
const WAIT_DEFAULT = 60000;
const GENE_DOES_NOT_EXIST_TEXT =
    'There is currently no information about this gene in OncoKB.';

moveToBody = () => {
    browser.moveToObject('body', 0, 0);
};

clickMutationPageTab = gene => {
    browser.click(`#mutationsPageTabs .tabAnchor_${gene}`);
    waitForNetworkQuiet(WAIT_DEFAULT);
};

waitForOncoKbCardExist = () => {
    browser.waitForExist(
        `[data-test="${ONCOKB_CARD_DATA_TEST_NAME}"]`,
        WAIT_DEFAULT
    );
    waitForNetworkQuiet(WAIT_DEFAULT);
};

moveToOncoKBIcon = gene => {
    // find oncokb image
    const oncokbIcon = `[data-test2="${gene}"][data-test="oncogenic-icon-image"]`;

    // move over oncokb image (this is deprecated, but there is no new
    // function yet)
    browser.waitForExist(oncokbIcon, WAIT_DEFAULT);
    browser.moveToObject(oncokbIcon, 5, 5);

    waitForOncoKbCardExist();
};

toggleLevelsOfEvidence = () => {
    // Toggle the levels of evidence
    browser.click(
        '[data-test="oncokb-card-levels-of-evidence-dropdown-header"]'
    );
    // Wait for the animation
    browser.pause(1000);
};

checkOncogenicityScreenshot = (gene, showLevelsOfEvidence = false) => {
    moveToOncoKBIcon(gene);

    if (showLevelsOfEvidence) {
        // Open LoE
        toggleLevelsOfEvidence();
    }

    assertScreenShotMatch(browser.checkElement('body'));
};

checkMutationEffectScreenshot = gene => {
    moveToOncoKBIcon(gene);

    // Click on the mutation effect tab
    const mutationEffectTab = '[data-test="mutationEffect-tab"]';
    browser.click(mutationEffectTab);
    waitForNetworkQuiet(WAIT_DEFAULT);

    browser.moveToObject('[data-test="mutationEffect-pane"]', 5, 5);
    assertScreenShotMatch(browser.checkElement('body'));
};

onoKbCardWithInfoSuite = (prefix, gene, showLevelsOfEvidence = false) => {
    it(`${prefix} - Oncogenicity tab shows correctly`, () => {
        checkOncogenicityScreenshot(gene, showLevelsOfEvidence);
    });
    it.skip(`${prefix} - mutation effect tab shows correctly`, () => {
        checkMutationEffectScreenshot(gene);
    });
};

describe('OncoKB Integration', () => {
    describe('Check oncokb card', () => {
        describe('Check patient view', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/patient?sampleId=TCGA-AA-A02W-01&studyId=coadread_tcga_pub`
                );
                waitForNetworkQuiet(WAIT_DEFAULT);
                // Set to default visual regression size
                // The default is in webdriver-manager.conf.js
                browser.setViewportSize({ height: 1000, width: 1600 });
            });

            onoKbCardWithInfoSuite('patient view - with levels', 'KRAS', true);

            onoKbCardWithInfoSuite('patient view - without levels', 'TP53');

            it('patient view - gene is cancer gene but has not been curated', () => {
                const gene = 'LRP1B';
                // filter the table
                var textArea = browser.$(
                    '[data-test=patientview-mutation-table] [class*=tableSearchInput]'
                );
                textArea.setValue(gene);

                // wait for the animation
                browser.pause(1000);

                moveToOncoKBIcon(gene);
                assertScreenShotMatch(browser.checkElement('body'));
            });
            it('patient view - gene does not exist in oncokb', () => {
                const gene = 'ADAM5';
                // filter the table
                var textArea = browser.$(
                    '[data-test=patientview-copynumber-table] [class*=tableSearchInput]'
                );
                textArea.setValue(gene);

                // wait for the animation
                browser.pause(1000);

                moveToOncoKBIcon(gene);
                browser.getText(
                    '[data-test="oncokb-card-additional-info"]',
                    GENE_DOES_NOT_EXIST_TEXT
                );
            });
        });
        describe('Check results view', () => {
            before(() => {
                goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=coadread_tcga_pub&case_ids=coadread_tcga_pub%3ATCGA-AA-A02W-01&case_set_id=-1&data_priority=0&gene_list=TP53%250AKRAS%250ALRP1B%250ADNASE1L3&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&profileFilter=0&tab_index=tab_visualize`
                );
                waitForNetworkQuiet(WAIT_DEFAULT);
                // Set to default visual regression size
                // The default is in webdriver-manager.conf.js
                browser.setViewportSize({ height: 1000, width: 1600 });
            });
            describe('KRAS', () => {
                before(() => {
                    clickMutationPageTab('KRAS');
                });
                it('results view - with levels - Oncogenicity tab shows correctly', () => {
                    checkOncogenicityScreenshot('KRAS');
                });
            });

            describe('TP53', () => {
                before(() => {
                    clickMutationPageTab('TP53');
                });
                it('results view - without levels - Oncogenicity tab shows correctly', () => {
                    checkOncogenicityScreenshot('TP53');
                });
            });

            describe('LRP1B', () => {
                before(() => {
                    clickMutationPageTab('LRP1B');
                });
                it('results view - gene is cancer gene but has not been curated', () => {
                    moveToOncoKBIcon('LRP1B');
                    assertScreenShotMatch(browser.checkElement('body'));
                });
            });

            describe('DNASE1L3', () => {
                before(() => {
                    clickMutationPageTab('DNASE1L3');
                });
                it('results view - gene does not exist in oncokb', () => {
                    moveToOncoKBIcon('DNASE1L3');
                    browser.getText(
                        '[data-test="oncokb-card-additional-info"]',
                        GENE_DOES_NOT_EXIST_TEXT
                    );
                });
            });
        });
    });
});

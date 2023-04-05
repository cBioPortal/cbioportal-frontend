const assert = require('assert');
const { waitForNetworkQuiet } = require('../../shared/specUtils');
const goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const STUDY_VIEW_URL = `${CBIOPORTAL_URL}/study/summary?id=study_es_0`;
const ALTERATION_MENU_BTN = `button[data-test="AlterationFilterButton"]`;
const SHOW_UNKNOWN_TIER = `input[data-test="ShowUnknownTier"]`;
const SV_TABLE = `div[data-test="structural variants-table"]`;
const ANY_ROW = `div[aria-rowindex]`;
const BRAF_ROW = `div[aria-rowindex="1"]`;
const GENE_NAME = `div[data-test="geneNameCell"]`;
const ALTERATIONS_TOTAL = `span[data-test="numberOfAlterations"]`;
const ALTERATION_CASES = `span[data-test="numberOfAlteredCasesText"]`;
const SHOW_CLASS_3 = `input[data-test="Class_3"]`;
const SHOW_CLASS_4 = `input[data-test="Class_4"]`;
const SHOW_PUTATIVE_DRIVERS = `input[data-test="ShowDriver"]`;
const SHOW_UNKNOWN_ONCOGENICITY = `input[data-test="ShowUnknownOncogenicity"]`;

describe('custom driver annotations feature in study view', function() {
    describe('structural variants', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(STUDY_VIEW_URL, true);
            waitForNetworkQuiet();
        });

        it('shows all structural variants', () => {
            $(SV_TABLE)
                .$(BRAF_ROW)
                .waitForDisplayed();
            assert($(SV_TABLE).$$(ANY_ROW).length === 21);
            let geneName = $(SV_TABLE)
                .$(BRAF_ROW)
                .$(GENE_NAME)
                .getText();
            assert(geneName === 'BRAF');
            const alterations = $(SV_TABLE)
                .$(BRAF_ROW)
                .$(ALTERATIONS_TOTAL);
            assert(alterations.getText() === '36');
            const alterationCases = $(SV_TABLE)
                .$(BRAF_ROW)
                .$(ALTERATION_CASES)
                .getText();
            assert(alterationCases === '35');
        });

        it('can exclude unknown (and NULL) driver tiers', () => {
            $(ALTERATION_MENU_BTN).click();
            $(SHOW_UNKNOWN_TIER).waitForDisplayed(5000);
            assert($(SHOW_UNKNOWN_TIER).isSelected());
            $(SHOW_UNKNOWN_TIER).click();
            $(SV_TABLE)
                .$(BRAF_ROW)
                .waitForDisplayed();
            assert($(SV_TABLE).$$(ANY_ROW).length === 10);
            const alterations = $(SV_TABLE)
                .$(BRAF_ROW)
                .$(ALTERATIONS_TOTAL)
                .getText();
            assert(alterations === '1');
            const brafCases = $(SV_TABLE)
                .$(BRAF_ROW)
                .$(ALTERATION_CASES)
                .getText();
            assert(brafCases === '1');
        });

        it('can exclude custom driver tiers', () => {
            $(ALTERATION_MENU_BTN).click();
            $(SHOW_UNKNOWN_TIER).waitForDisplayed(5000);
            assert($(SHOW_UNKNOWN_TIER).isSelected());
            $(SHOW_UNKNOWN_TIER).click();

            assert($(SHOW_CLASS_3).isSelected());
            $(SHOW_CLASS_3).click();

            assert($(SHOW_CLASS_4).isSelected());
            $(SHOW_CLASS_4).click();

            $(SV_TABLE)
                .$(ANY_ROW)
                .waitForDisplayed();

            assert($(SV_TABLE).$$(ANY_ROW).length === 5);
            assert(getAllGeneNames() === 'ALK,EGFR,EML4,ERG,TMPRSS2');
        });

        it('can exclude custom drivers', () => {
            $(ALTERATION_MENU_BTN).click();
            $(SHOW_UNKNOWN_TIER).waitForDisplayed(5000);

            assert($(SHOW_PUTATIVE_DRIVERS).isSelected());
            $(SHOW_PUTATIVE_DRIVERS).click();

            assert($(SHOW_UNKNOWN_ONCOGENICITY).isSelected());
            $(SHOW_UNKNOWN_ONCOGENICITY).click();

            $(SV_TABLE)
                .$(ANY_ROW)
                .waitForDisplayed();

            assert($(SV_TABLE).$$(ANY_ROW).length === 2);
            assert(getAllGeneNames() === 'NCOA4,RET');
        });
    });
});

function getAllGeneNames() {
    return $(SV_TABLE)
        .$$(ANY_ROW)
        .map(e => e.$(GENE_NAME).getText())
        .sort()
        .join();
}

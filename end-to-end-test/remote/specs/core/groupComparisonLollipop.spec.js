var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var waitForNetworkQuiet = require('../../../shared/specUtils')
    .waitForNetworkQuiet;
var setInputText = require('../../../shared/specUtils').setInputText;
var setSettingsMenuOpen = require('../../../shared/specUtils')
    .setSettingsMenuOpen;
const { getElementByTestHandle } = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('group comparison mutations tab tests', function() {
    describe('lollipop alerts and plot display', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison?comparisonId=634006c24dd45f2bc4c3d4aa`
            );
            $('div[data-test="ComparisonPageOverlapTabDiv"]').waitForExist();
        });

        it('too many groups alert displayed when more than 2 groups selected', function() {
            $('a.tabAnchor_mutations').waitForExist();
            $('a.tabAnchor_mutations').click();
            browser.pause(1000);
            assert.equal(
                $('[data-test="TooManyGroupsAlert"]').isDisplayed(),
                true
            );
        });

        it('not enough groups alert displayed when less than 2 groups selected', function() {
            $('a=Deselect all').waitForExist();
            $('a=Deselect all').click();
            browser.pause(1000);
            assert.equal(
                $('[data-test="NotEnoughGroupsAlert"]').isDisplayed(),
                true
            );
            $(
                '[data-test="groupSelectorButtonColon Adenocarcinoma"]'
            ).waitForExist();
            $('[data-test="groupSelectorButtonColon Adenocarcinoma"]').click();
            browser.pause(1000);
            assert.equal(
                $('[data-test="NotEnoughGroupsAlert"]').isDisplayed(),
                true
            );
        });

        it('lollipop plot displayed when 2 groups selected', function() {
            $(
                '[data-test="groupSelectorButtonColorectal Adenocarcinoma"]'
            ).waitForExist();
            $(
                '[data-test="groupSelectorButtonColorectal Adenocarcinoma"]'
            ).click();
            $('[data-test="LollipopPlot"]').waitForExist({ timeout: 20000 });
            assert.equal($('[data-test="LollipopPlot"]').isDisplayed(), true);
        });
    });

    describe('lollipop tooltip display', function() {
        it('displays double tooltip when lollipop is present in both plots at the same position', function() {
            $('.lollipop-0').waitForExist();
            $('.lollipop-0').moveTo();
            $('[data-test="tooltip-1450-Colon Adenocarcinoma"]').waitForExist();
            $(
                '[data-test="tooltip-1450-Colorectal Adenocarcinoma"]'
            ).waitForExist();
            assert.equal(
                $(
                    '[data-test="tooltip-1450-Colon Adenocarcinoma"]'
                ).isDisplayed(),
                true
            );
            assert.equal(
                $(
                    '[data-test="tooltip-1450-Colorectal Adenocarcinoma"]'
                ).isDisplayed(),
                true
            );
        });
        it("doesn't display % when axis scale # is toggled", function() {
            $('[data-test="AxisScaleSwitch#"]').click();
            $('.lollipop-6').waitForExist();
            $('.lollipop-6').moveTo();
            $('[data-test="tooltip-1378-Colon Adenocarcinoma"]').waitForExist();
            assert.equal(
                $('[data-test="tooltip-1378-Colon Adenocarcinoma"]')
                    .getText()
                    .includes('%'),
                false
            );
        });
        it('displays % when axis scale % is toggled', function() {
            $('[data-test="AxisScaleSwitch%"]').click();
            $('.lollipop-6').waitForExist();
            $('.lollipop-6').moveTo();
            $('[data-test="tooltip-1378-Colon Adenocarcinoma"]').waitForExist();
            assert.equal(
                $('[data-test="tooltip-1378-Colon Adenocarcinoma"]')
                    .getText()
                    .includes('%'),
                true
            );
        });
    });

    describe('selecting gene with dropdown and tabs', function() {
        it('clicking on gene tab sets the selected gene', function() {
            $('a.tabAnchor_TP53').click();
            waitForNetworkQuiet();
            assert.equal(
                $('[data-test="LollipopPlotTitle"]')
                    .getText()
                    .includes('TP53'),
                true
            );
            assert.equal($('[data-test="GeneSelector"]').getText(), 'TP53');
        });

        it('selecting gene in gene selector sets the selected gene', function() {
            setInputText(
                'div[data-test=GeneSelector] input[type=text]',
                'KRAS'
            );
            browser.keys('Enter');
            waitForNetworkQuiet();
            assert.equal(
                $('[data-test="LollipopPlotTitle"]')
                    .getText()
                    .includes('KRAS'),
                true
            );
            assert.equal(
                $('a.tabAnchor_KRAS')
                    .parentElement()
                    .getAttribute('class')
                    .includes('active'),
                true
            );
        });
    });

    describe('adding annotation tracks', function() {
        it('track visibility stays on gene change', function() {
            $('div.css-dlmlqy-control').click();
            $('[data-test="CancerHotspots"]').click();
            waitForNetworkQuiet();
            $('svg.css-tj5bde-Svg').click();
            waitForNetworkQuiet();
            assert.equal(
                $('[data-test="AnnotationTracks"]').isDisplayed(),
                true
            );
        });
    });

    describe('driver/vus and protein badge selecting', function() {
        it('clicking badge filters both top and bottom plots', function() {
            $('strong=Truncating').click();
            // counts are unchanged
            assert.equal(
                $('[data-test="badge-truncating_putative_driver"]').getText(),
                '115'
            );
            assert.equal(
                $$(
                    '[data-test="badge-truncating_putative_driver"]'
                )[1].getText(),
                '38'
            );

            assert.equal(
                $(
                    '[data-test="badge-truncating_putative_driver"]'
                ).getCSSProperty('color').parsed.hex,
                $$(
                    '[data-test="badge-truncating_putative_driver"]'
                )[1].getCSSProperty('color').parsed.hex
            );
            assert.equal(
                $(
                    'div.mutationMapper-module__filterResetPanel__2aFDu'
                ).isDisplayed(),
                true
            );

            // undo filter
            $('strong=Truncating').click();
            assert.equal(
                $(
                    '[data-test="badge-truncating_putative_driver"]'
                ).getCSSProperty('color').parsed.hex,
                $$(
                    '[data-test="badge-truncating_putative_driver"]'
                )[1].getCSSProperty('color').parsed.hex
            );
            assert.equal(
                $(
                    'div.mutationMapper-module__filterResetPanel__2aFDu'
                ).isDisplayed(),
                false
            );
        });

        it('adjusts mutation counts based on driver annotation settings', function() {
            getElementByTestHandle('badge-driver')
                .$('span=116')
                .waitForExist();

            setSettingsMenuOpen(true);
            getElementByTestHandle('annotateOncoKb').click();
            setSettingsMenuOpen(false);

            $('.lollipop-svgnode').waitForDisplayed();

            getElementByTestHandle('badge-driver')
                .$('span=0')
                .waitForExist();

            setSettingsMenuOpen(true);
            getElementByTestHandle('annotateOncoKb').click();
            setSettingsMenuOpen(false);

            $('.lollipop-svgnode').waitForDisplayed();

            getElementByTestHandle('badge-driver')
                .$('span=116')
                .waitForExist();
        });
    });
});

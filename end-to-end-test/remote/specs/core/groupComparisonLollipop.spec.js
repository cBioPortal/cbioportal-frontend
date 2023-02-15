var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var setInputText = require('../../../shared/specUtils').setInputText;
var setSettingsMenuOpen = require('../../../shared/specUtils')
    .setSettingsMenuOpen;
const { getElementByTestHandle } = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('group comparison mutations tab tests', function() {
    describe('lollipop alerts and plot display', function() {
        before(function() {
            goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/mutations?comparisonId=634006c24dd45f2bc4c3d4aa`
            );
            $('a.tabAnchor_mutations').waitForDisplayed({ timeout: 20000 });
        });

        it('too many groups alert displayed when more than 2 groups selected', function() {
            getElementByTestHandle('TooManyGroupsAlert').waitForDisplayed();
        });

        it('not enough groups alert displayed when less than 2 groups selected', function() {
            $('a=Deselect all').click();
            getElementByTestHandle('NotEnoughGroupsAlert').waitForDisplayed();
            getElementByTestHandle(
                'groupSelectorButtonColon Adenocarcinoma'
            ).click();
            getElementByTestHandle('NotEnoughGroupsAlert').waitForDisplayed();
        });

        it('lollipop plot displayed when 2 groups selected', function() {
            getElementByTestHandle(
                'groupSelectorButtonColorectal Adenocarcinoma'
            ).click();
            getElementByTestHandle(
                'ComparisonPageMutationsTabPlot'
            ).waitForDisplayed({ timeout: 25000 });
        });
    });

    describe('lollipop tooltip display', function() {
        it('displays double tooltip when lollipop is present in both plots at the same position', function() {
            $('.lollipop-0').waitForExist();
            $('.lollipop-0').moveTo();
            getElementByTestHandle(
                'tooltip-1450-Colon Adenocarcinoma'
            ).waitForDisplayed();
            getElementByTestHandle(
                'tooltip-1450-Colorectal Adenocarcinoma'
            ).waitForDisplayed();
        });
        it("doesn't display % when axis scale # is toggled", function() {
            getElementByTestHandle('AxisScaleSwitch#').click();
            $('.lollipop-6').waitForExist();
            $('.lollipop-6').moveTo();
            assert.equal(
                $('[data-test="tooltip-1378-Colon Adenocarcinoma"]')
                    .getText()
                    .includes('%'),
                false
            );
        });
        it('displays % when axis scale % is toggled', function() {
            getElementByTestHandle('AxisScaleSwitch%').click();
            $('.lollipop-6').waitForExist();
            $('.lollipop-6').moveTo();
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
            getElementByTestHandle('ComparisonPageMutationsTabPlot')
                .$('h3')
                .waitForExist();
            assert.equal(
                getElementByTestHandle('ComparisonPageMutationsTabPlot')
                    .$('h3')
                    .getText()
                    .includes('TP53'),
                true
            );
            assert.equal(
                getElementByTestHandle('GeneSelector').getText(),
                'TP53'
            );
        });

        it('selecting gene in gene selector sets the selected gene', function() {
            setInputText(
                'div[data-test=GeneSelector] input[type=text]',
                'KRAS'
            );
            browser.keys('Enter');
            getElementByTestHandle('ComparisonPageMutationsTabPlot')
                .$('h3')
                .waitForExist();
            assert.equal(
                getElementByTestHandle('ComparisonPageMutationsTabPlot')
                    .$('h3')
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
            $('div.annotation-track-selector').click();
            getElementByTestHandle('CancerHotspots').click();
            $('a.tabAnchor_APC').waitForDisplayed();
            $('a.tabAnchor_APC').click();
            getElementByTestHandle('AnnotationTracks').waitForDisplayed();
        });
    });

    describe('protein badge selecting', function() {
        it('clicking badge filters both top and bottom plots', function() {
            // deselecting protein driver badge
            getElementByTestHandle('badge-truncating_putative_driver').click();
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
                    '[data-test="badge-truncating_putative_driver"]'
                ).getCSSProperty('color').parsed.hex,
                '#000000'
            );
            getElementByTestHandle('filter-reset-panel').waitForDisplayed();

            // undo filter
            getElementByTestHandle('badge-truncating_putative_driver').click();
            assert.equal(
                $(
                    '[data-test="badge-truncating_putative_driver"]'
                ).getCSSProperty('color').parsed.hex,
                $$(
                    '[data-test="badge-truncating_putative_driver"]'
                )[1].getCSSProperty('color').parsed.hex
            );
            assert.equal(
                getElementByTestHandle('filter-reset-panel').isDisplayed(),
                false
            );
        });

        it('deselecting protein badge deselects both protein driver and vus badges', function() {
            // deselecting protein badge
            $('strong=Inframe').click();

            assert.equal(
                $('[data-test="badge-inframe_putative_driver"]').getCSSProperty(
                    'color'
                ).parsed.hex,
                $$(
                    '[data-test="badge-inframe_putative_driver"]'
                )[1].getCSSProperty('color').parsed.hex
            );
            assert.equal(
                $(
                    '[data-test="badge-inframe_unknown_significance"]'
                ).getCSSProperty('color').parsed.hex,
                $$(
                    '[data-test="badge-inframe_unknown_significance"]'
                )[1].getCSSProperty('color').parsed.hex
            );

            // both protein driver and vus badges are deselected
            assert.equal(
                $('[data-test="badge-inframe_putative_driver"]').getCSSProperty(
                    'color'
                ).parsed.hex,
                '#993404'
            );

            assert.equal(
                $(
                    '[data-test="badge-inframe_unknown_significance"]'
                ).getCSSProperty('color').parsed.hex,
                '#a68028'
            );
        });

        it('selecting protein badge selects both protein driver and vus badges', function() {
            // selecting protein badge
            $('strong=Inframe').click();

            assert.equal(
                $('[data-test="badge-inframe_putative_driver"]').getCSSProperty(
                    'color'
                ).parsed.hex,
                $$(
                    '[data-test="badge-inframe_putative_driver"]'
                )[1].getCSSProperty('color').parsed.hex
            );
            assert.equal(
                $(
                    '[data-test="badge-inframe_unknown_significance"]'
                ).getCSSProperty('color').parsed.hex,
                $$(
                    '[data-test="badge-inframe_unknown_significance"]'
                )[1].getCSSProperty('color').parsed.hex
            );

            // both protein driver and vus badges are selected
            assert.equal(
                $('[data-test="badge-inframe_putative_driver"]').getCSSProperty(
                    'color'
                ).parsed.hex,
                $(
                    '[data-test="badge-inframe_unknown_significance"]'
                ).getCSSProperty('color').parsed.hex
            );

            // deselecting protein driver badge
            getElementByTestHandle('badge-inframe_putative_driver').click();
            // selecting protein badge
            $('strong=Inframe').click();

            assert.equal(
                $('[data-test="badge-inframe_putative_driver"]').getCSSProperty(
                    'color'
                ).parsed.hex,
                $$(
                    '[data-test="badge-inframe_putative_driver"]'
                )[1].getCSSProperty('color').parsed.hex
            );
            assert.equal(
                $(
                    '[data-test="badge-inframe_unknown_significance"]'
                ).getCSSProperty('color').parsed.hex,
                $$(
                    '[data-test="badge-inframe_unknown_significance"]'
                )[1].getCSSProperty('color').parsed.hex
            );

            // both protein driver and vus badges are selected if one of them is deselected
            assert.equal(
                $('[data-test="badge-inframe_putative_driver"]').getCSSProperty(
                    'color'
                ).parsed.hex,
                $(
                    '[data-test="badge-inframe_unknown_significance"]'
                ).getCSSProperty('color').parsed.hex
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

    describe('protein only selecting', function() {
        it('clicking protein driver/vus badge only button selects protein driver/vus, deselects others', function() {
            getElementByTestHandle('splice_putative_driver_only').click();

            assert.equal(
                $('[data-test="badge-splice_putative_driver"]').getCSSProperty(
                    'color'
                ).parsed.hex,
                $$(
                    '[data-test="badge-splice_putative_driver"]'
                )[1].getCSSProperty('color').parsed.hex
            );

            // protein driver badge selected
            assert.equal(
                $('[data-test="badge-splice_putative_driver"]').getCSSProperty(
                    'color'
                ).parsed.hex,
                '#ffffff'
            );
            // protein vus badge deselected
            assert.equal(
                $(
                    '[data-test="badge-splice_unknown_significance"]'
                ).getCSSProperty('color').parsed.hex,
                '#f0b87b'
            );
            // driver badge deselected
            assert.equal(
                $$('[data-test="badge-driver"]')[1].getCSSProperty('color')
                    .parsed.hex,
                '#000000'
            );
        });

        it('clicking protein type badge only button selects both protein driver and vus, deselects others', function() {
            getElementByTestHandle('missense_only').click();

            assert.equal(
                $(
                    '[data-test="badge-missense_putative_driver"]'
                ).getCSSProperty('color').parsed.hex,
                $$(
                    '[data-test="badge-missense_putative_driver"]'
                )[1].getCSSProperty('color').parsed.hex
            );
            assert.equal(
                $(
                    '[data-test="badge-missense_unknown_significance"]'
                ).getCSSProperty('color').parsed.hex,
                $$(
                    '[data-test="badge-missense_unknown_significance"]'
                )[1].getCSSProperty('color').parsed.hex
            );

            // protein driver and vus badges both selected
            assert.equal(
                $(
                    '[data-test="badge-missense_putative_driver"]'
                ).getCSSProperty('color').parsed.hex,
                $(
                    '[data-test="badge-missense_unknown_significance"]'
                ).getCSSProperty('color').parsed.hex
            );
            // driver badge deselected
            assert.equal(
                $$('[data-test="badge-driver"]')[1].getCSSProperty('color')
                    .parsed.hex,
                '#000000'
            );
            // vus badge deselected
            assert.equal(
                $$('[data-test="badge-VUS"]')[1].getCSSProperty('color').parsed
                    .hex,
                '#696969'
            );
        });

        it('clicking driver/vus badge only button selects all protein driver/vus badges, deselects protein vus/driver badges', function() {
            // selecting vus badge, then driver only button
            getElementByTestHandle('badge-VUS').click();
            getElementByTestHandle('driver_only').click();

            assert.equal(
                $$('[data-test="badge-driver"]')[1].getCSSProperty('color')
                    .parsed.hex,
                $$('[data-test="badge-driver"]')[3].getCSSProperty('color')
                    .parsed.hex
            );

            // driver badge selected
            assert.equal(
                $$('[data-test="badge-driver"]')[1].getCSSProperty('color')
                    .parsed.hex,
                '#ffffff'
            );
            // vus badge deselected
            assert.equal(
                $('[data-test="badge-VUS"]').getCSSProperty('color').parsed.hex,
                '#696969'
            );

            // selecting vus only button
            getElementByTestHandle('VUS_only').click();

            assert.equal(
                $('[data-test="badge-VUS"]').getCSSProperty('color').parsed.hex,
                $$('[data-test="badge-VUS"]')[1].getCSSProperty('color').parsed
                    .hex
            );

            // vus badge selected
            assert.equal(
                $('[data-test="badge-VUS"]').getCSSProperty('color').parsed.hex,
                '#ffffff'
            );
            // driver badge deselected
            assert.equal(
                $$('[data-test="badge-driver"]')[1].getCSSProperty('color')
                    .parsed.hex,
                '#000000'
            );
        });
    });
});

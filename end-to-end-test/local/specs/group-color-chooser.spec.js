var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var reactSelectOption = require('../../shared/specUtils').reactSelectOption;
var getReactSelectOptions = require('../../shared/specUtils')
    .getReactSelectOptions;
var selectReactSelectOption = require('../../shared/specUtils')
    .selectReactSelectOption;
var useExternalFrontend = require('../../shared/specUtils').useExternalFrontend;

var { clickQueryByGeneButton, showGsva } = require('../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyViewUrl = CBIOPORTAL_URL + '/study/summary?id=study_es_0';

describe('color chooser for comparison groups', function() {
    if (useExternalFrontend) {
        describe('in study view', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(studyViewUrl);
            });

            it('shows reserved colors for LIVING group', () => {
                selectClinicalGroup('OS_STATUS', '1:DECEASED');
                var color = $(
                    'svg[data-test=color-picker-icon] rect'
                ).getAttribute('fill');
                assert.equal(color, '#d95f02');
            });

            it('shows reserved colors for DECEASED group', () => {
                selectClinicalGroup('OS_STATUS', '0:LIVING');
                var color = $(
                    'svg[data-test=color-picker-icon] rect'
                ).getAttribute('fill');
                assert.equal(color, '#1b9e77');
            });

            it('sets custom color for user-defined group', () => {
                selectClinicalGroup('OS_STATUS', '0:LIVING');
                var color = $(
                    'svg[data-test=color-picker-icon] rect'
                ).getAttribute('fill');
                assert.equal(color, '#1b9e77');
                selectColorForChooser(
                    $('svg[data-test=color-picker-icon] rect'),
                    '#f88508'
                );
                var color = $(
                    'svg[data-test=color-picker-icon] rect'
                ).getAttribute('fill');
                assert.equal(color, '#f88508');
            });

            it('shows `no color` icon for new group', () => {
                createGroup('group1');
                $('svg[data-test=color-picker-icon] line').waitForVisible();
                assert($('svg[data-test=color-picker-icon] line').isExisting());
            });

            it.only('resets color to `no color when clicking color twice', () => {
                createGroup('group1');
                selectColorForChooser(
                    $('svg[data-test=color-picker-icon] rect'),
                    '#f88508'
                );
                var color = $(
                    'svg[data-test=color-picker-icon] rect'
                ).getAttribute('fill');
                assert(color === '#f88508');
                selectColorForChooser(
                    $('svg[data-test=color-picker-icon] rect'),
                    '#f88508'
                );
                $('svg[data-test=color-picker-icon] line').waitForVisible();
                assert($('svg[data-test=color-picker-icon] line').isExisting());
            });

            it('gives warning for color selected twice', () => {
                createGroup('group1');
                createGroup('group2');
                selectColorForChooser(
                    $$('svg[data-test=color-picker-icon] rect')[0],
                    '#f88508'
                );
                selectColorForChooser(
                    $$('svg[data-test=color-picker-icon] rect')[1],
                    '#f88508'
                );
                // FIXME warning icons do not show atm
                assert(false);
            });
        });
    }

    describe('in group comparison', () => {
        beforeEach(() => {
            goToUrlAndSetLocalStorage(studyViewUrl);
        });

        it.only('uses user-defined colors', () => {
            createGroup('Group1');
            createGroup('Group2');
            selectColorForChooser(
                $$('svg[data-test=color-picker-icon] rect')[0],
                '#f88508'
            );
            selectColorForChooser(
                $$('svg[data-test=color-picker-icon] rect')[1],
                '#22aa99'
            );

            // open group comparison
            $('button[data-test=startGroupComparisonButton]').click();
            $('[data-test=groupSelectorButtons]').waitForVisible();

            // check colors of buttons
            $('[data-test=groupSelectorButtons]').waitForVisible();
            var button1 = $('[data-test=groupSelectorButtonGroup1]');
            var button2 = $('[data-test=groupSelectorButtonGroup2]');

            assert.equal(
                button1.getCssProperty('background-color'),
                'rgb(248, 133, 8)'
            );
            assert.equal(
                'rgb(34, 170, 153)',
                button2.getCssProperty('background-color')
            );

            // check colors of svg elements
            assert($('rect[stroke="#f88508"]').isExisting());
            assert($('rect[stroke="#22aa99"]').isExisting());
        });
    });
});

var selectClinicalGroup = (attribute, value) => {
    var url =
        CBIOPORTAL_URL +
        '/study/summary?id=study_es_0#filterJson={"clinicalDataFilters":[{"attributeId":"' +
        attribute +
        '","values":[{"value":"' +
        value +
        '"}]}],"studyIds":["study_es_0"]}';
    browser.url(url);
    createGroup();
};

var createGroup = name => {
    if (!$('button[data-test=createCustomGroupButton1]').isVisible()) {
        $('#groupManagementButton').waitForVisible();
        $('#groupManagementButton').click();
    }
    $('button[data-test=createCustomGroupButton1]').waitForVisible();
    $('button[data-test=createCustomGroupButton1]').click();
    $('button[data-test=createCustomGroupButton2]').waitForVisible(5000);
    if (name) {
        $('input[data-test=createCustomGroupInput]').setValue(name);
    }
    $('button[data-test=createCustomGroupButton2]').click();
    $('#groupManagementButton').waitForVisible();
    $('svg[data-test=color-picker-icon] rect').waitForVisible();
};

var selectColorForChooser = (chooser, color) => {
    chooser.click();
    $('div[title="' + color + '"]').waitForVisible();
    $('div[title="' + color + '"]').click();
    chooser.click();
    browser.waitUntil(function() {
        return (
            $('svg[data-test=color-picker-icon] rect').getAttribute('fill') ===
            color
        );
    }, 5000);
};

module.exports = {
    studyViewUrl: studyViewUrl,
};

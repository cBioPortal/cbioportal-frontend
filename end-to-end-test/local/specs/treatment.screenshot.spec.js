var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../shared/specUtils').goToUrlAndSetLocalStorage;
var assertScreenShotMatch = require('../../shared/lib/testUtils').assertScreenShotMatch;
var waitForOncoprint = require('../../shared/specUtils').waitForOncoprint;
var selectReactSelectOption =  require('../../shared/specUtils').selectReactSelectOption;
var oncoprintTabUrl = require('./treatment.spec').oncoprintTabUrl;
var openHeatmapMenu = require('./treatment.spec').openHeatmapMenu;

describe('treatment feature', () => {

    describe('oncoprint tab', () => {

        beforeEach(()=>{
            goToUrlAndSetLocalStorage(oncoprintTabUrl);
            waitForOncoprint();
        });

            it('shows treatment profile heatmap track for treatment', () => {
                openHeatmapMenu();
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout');
                $('.oncoprint__controls__heatmap_menu textarea').setValue('17-AAG');
                $('div.icon-area div.icon').waitForExist();
                $('button=Add Treatments to Heatmap').click();
                openHeatmapMenu();
                waitForOncoprint();
                var res = browser.checkElement('[id=oncoprintDiv]');
                assertScreenShotMatch(res);
            });
                        
            it('selects treatment in treatment select box when icon present', () => {
                openHeatmapMenu();
                selectReactSelectOption( $('.oncoprint__controls__heatmap_menu'), 'IC50 values of compounds on cellular phenotype readout');
                $('.oncoprint__controls__heatmap_menu textarea').setValue('17-AAG');
                $('div.icon-area div.icon').waitForExist();
                $('.treatment-selector .Select-control').click();
                var res = browser.checkElement('.Select-option*=17-AAG');
                assertScreenShotMatch(res);
            });

    });

});

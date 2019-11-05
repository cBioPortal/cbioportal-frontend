var goToUrlAndSetLocalStorage = require('../../../shared/specUtils').goToUrlAndSetLocalStorage;
var waitForPatientView = require('../../../shared/specUtils').waitForPatientView;
var assertScreenShotMatch = require('../../../shared/lib/testUtils').assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");
const patienViewUrl = CBIOPORTAL_URL+'/patient?studyId=teststudy_genepanels&caseId=patientA';

describe('patient view page', function() {

    describe('gene panel icons', () => {

        const iconIndexGenePanelSample = 2;
        const iconIndexWholeGenomeSample = 3;
        
        beforeEach(()=>{
            goToUrlAndSetLocalStorage(patienViewUrl);
            waitForPatientView();
        });

        it('shows gene panel icons behind mutation and CNA genomic tracks',() => {
            var res = browser.checkElement('div.genomicOverviewTracksContainer');
            assertScreenShotMatch(res);
        });

        it('filters mutation tracks based on gene filter setting',() => {
            var filterIcon = $('div[data-test=patientview-mutation-table]').$('i[data-test=gene-filter-icon]');
            filterIcon.click();
            var selectMenu = $('.rc-tooltip');
            const allGenesRadio = selectMenu.$('input[value=allSamples]');
            allGenesRadio.click();
            var res = browser.checkElement('div.genomicOverviewTracksContainer');
            assertScreenShotMatch(res);
        });

    });

});

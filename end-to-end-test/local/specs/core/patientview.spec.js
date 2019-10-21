var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils').goToUrlAndSetLocalStorage;
var useExternalFrontend = require('../../../shared/specUtils').useExternalFrontend;
var waitForPatientView = require('../../../shared/specUtils').waitForPatientView;
var waitForNetworkQuiet = require('../../../shared/specUtils').waitForNetworkQuiet;

var _ = require('lodash');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");
const patienViewUrl = CBIOPORTAL_URL+'/patient?studyId=teststudy_genepanels&caseId=patientA';

describe('patient view page', function() {

    if (useExternalFrontend) {

        describe('gene panel information', () => {
            
            before(()=>{
                goToUrlAndSetLocalStorage(patienViewUrl);
                waitForPatientView();
            });

            const p = 'sample-icon';
            const n = 'not-profiled-icon';
            
            it('mutation table shows correct sample icons, non-profiled icons and invisible icons',() => {
                
                const sampleIcon = {
                    ERBB2:  [n, n, n, p, p],
                    ABLIM1: [p, p, n, p, p],
                    PIEZO1: [n, n, p, p, p],
                    CADM2:  [p, p, p, p, p]
                }
                
                const sampleVisibility = {
                    ERBB2:  [true , true, true, true , false],
                    ABLIM1: [true , true, true, false, false],
                    PIEZO1: [true , true, true, false, false],
                    CADM2:  [false, true, true, false, false]
                }
                
                const genes = _.keys(sampleIcon);
                genes.forEach((gene)=>{
                    testSampleIcon(gene, 'patientview-mutation-table', sampleIcon[gene], sampleVisibility[gene]);
                })

            });

            it('CNA table shows correct sample icons, non-profiled icons and invisible icons',() => {

                const sampleIcon = {
                    ERBB2:  [n, n, p, p, n],
                    CADM2:  [p, p, p, p, p],
                    PIEZO1: [n, p, p, p, n]
                }
                
                const sampleVisibility = {
                    ERBB2:  [true , true, false, true , true],
                    CADM2:  [false, true, false, false, true],
                    PIEZO1: [true , true, false, false, true],
                }

                const genes = _.keys(sampleIcon);
                
                genes.forEach((gene)=>{
                    testSampleIcon(gene, 'patientview-copynumber-table', sampleIcon[gene], sampleVisibility[gene]);
                })

            });

        });

    }
});

function testSampleIcon(geneSymbol, tableTag, sampleIconTypes, sampleVisibilities) {

    
    const geneCell = $('div[data-test='+tableTag+'] table').$('span='+geneSymbol);
    const samplesCell = geneCell.$('..').$('..').$('div[data-test=samples-cell] ul');
    const icons = samplesCell.$$("li");
    // browser.debug();
    
    sampleIconTypes.forEach((desiredDataType, i) => {
        const isExpectedIcon = icons[i].$('svg[data-test='+desiredDataType+']').isExisting();
        assert.equal(isExpectedIcon, true, "Gene "+geneSymbol+": icon type at position "+i+" is not `"+desiredDataType+"`");
    });

    sampleVisibilities.forEach((desiredVisibility, i) => {
        const actualVisibility = icons[i].isVisible();
        assert.equal(actualVisibility, desiredVisibility, "Gene "+geneSymbol+": icon visibility at position "+i+" is not `"+desiredVisibility+"`, but is `"+actualVisibility+"`");
    });
}
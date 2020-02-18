var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils').goToUrlAndSetLocalStorage;
var useExternalFrontend = require('../../../shared/specUtils').useExternalFrontend;
var waitForPatientView = require('../../../shared/specUtils').waitForPatientView;

var _ = require('lodash');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const patienViewUrl = CBIOPORTAL_URL + '/patient?studyId=teststudy_genepanels&caseId=patientA';

describe('patient view page', function() {
    if (useExternalFrontend) {
        describe('gene panel information', () => {
            before(() => {
                goToUrlAndSetLocalStorage(patienViewUrl);
                waitForPatientView();
            });

            const p = 'sample-icon';
            const n = 'not-profiled-icon';

            it('mutation table shows correct sample icons, non-profiled icons and invisible icons', () => {
                const sampleIcon = {
                    ERBB2: [n, n, n, p, p],
                    ABLIM1: [p, p, n, p, p],
                    PIEZO1: [n, n, p, p, p],
                    CADM2: [p, p, p, p, p],
                };

                const sampleVisibility = {
                    ERBB2: [true, true, true, true, false],
                    ABLIM1: [true, true, true, false, false],
                    PIEZO1: [true, true, true, false, false],
                    CADM2: [false, true, true, false, false],
                };

                const genes = _.keys(sampleIcon);
                genes.forEach(gene => {
                    testSampleIcon(
                        gene,
                        'patientview-mutation-table',
                        sampleIcon[gene],
                        sampleVisibility[gene]
                    );
                });
            });

            it('CNA table shows correct sample icons, non-profiled icons and invisible icons', () => {
                const sampleIcon = {
                    ERBB2: [n, n, p, p, n],
                    CADM2: [p, p, p, p, p],
                    PIEZO1: [n, p, p, p, n],
                };

                const sampleVisibility = {
                    ERBB2: [true, true, false, true, true],
                    CADM2: [false, true, false, false, true],
                    PIEZO1: [true, true, false, false, true],
                };

                const genes = _.keys(sampleIcon);

                genes.forEach(gene => {
                    testSampleIcon(
                        gene,
                        'patientview-copynumber-table',
                        sampleIcon[gene],
                        sampleVisibility[gene]
                    );
                });
            });
        });

        describe('filtering of mutation table', () => {
            let selectMenu;
            let filterIcon;

            before(() => {
                goToUrlAndSetLocalStorage(patienViewUrl);
                waitForPatientView();
            });

            it('filter menu icon is shown when gene panels are used', () => {
                filterIcon = $('div[data-test=patientview-mutation-table]').$(
                    'i[data-test=gene-filter-icon]'
                );
                assert(filterIcon.isVisible());
            });

            it('opens selection menu when filter icon clicked', () => {
                filterIcon.click();
                selectMenu = $('.rc-tooltip');
                assert(selectMenu.isVisible());
            });

            it('removes genes profiles profiled in some samples then `all genes` option selected', () => {
                const allGenesRadio = selectMenu.$('input[value=allSamples]');
                allGenesRadio.click();
                const geneEntries = $$('[data-test=mutation-table-gene-column]');
                assert.equal(geneEntries.length, 1);
                const geneName = geneEntries[0].getText();
                assert.equal(geneName, 'CADM2');
            });

            it('re-adds genes when `any genes` option selected', () => {
                const anyGenesRadio = selectMenu.$('input[value=anySample]');
                anyGenesRadio.click();
                const geneEntries = $$('[data-test=mutation-table-gene-column]');
                assert.equal(geneEntries.length, 4);
            });

            it('closes selection menu when filter icon clicked again', () => {
                filterIcon.click();
                selectMenu = $('.rc-tooltip');
                assert(!selectMenu.isVisible());
            });

            it('filter menu icon is not shown when gene panels are not used', () => {
                goToUrlAndSetLocalStorage(
                    CBIOPORTAL_URL + '/patient?studyId=study_es_0&caseId=TCGA-A1-A0SK'
                );
                waitForPatientView();
                var filterIcon = $('div[data-test=patientview-mutation-table]').$(
                    'i[data-test=gene-filter-icon]'
                );
                assert(!filterIcon.isVisible());
            });
        });

        describe('filtering of CNA table', () => {
            let selectMenu;
            let filterIcon;

            before(() => {
                goToUrlAndSetLocalStorage(patienViewUrl);
                waitForPatientView();
            });

            it('filter menu icon is shown when gene panels are used', () => {
                filterIcon = $('div[data-test=patientview-copynumber-table]').$(
                    'i[data-test=gene-filter-icon]'
                );
                assert(filterIcon.isVisible());
            });

            it('opens selection menu when filter icon clicked', () => {
                filterIcon.click();
                selectMenu = $('.rc-tooltip');
                assert(selectMenu.isVisible());
            });

            it('removes genes profiles profiled in some samples then `all genes` option selected', () => {
                const allGenesRadio = selectMenu.$('input[value=allSamples]');
                allGenesRadio.click();
                const geneEntries = $$('[data-test=cna-table-gene-column]');
                assert.equal(geneEntries.length, 1);
                const geneName = geneEntries[0].getText();
                assert.equal(geneName, 'CADM2');
            });

            it('re-adds genes when `any genes` option selected', () => {
                const anyGenesRadio = selectMenu.$('input[value=anySample]');
                anyGenesRadio.click();
                const geneEntries = $$('[data-test=cna-table-gene-column]');
                assert.equal(geneEntries.length, 3);
            });

            it('closes selection menu when filter icon clicked again', () => {
                filterIcon.click();
                selectMenu = $('.rc-tooltip');
                assert(!selectMenu.isVisible());
            });

            it('filter menu icon is not shown when gene panels are not used', () => {
                goToUrlAndSetLocalStorage(
                    CBIOPORTAL_URL + '/patient?studyId=study_es_0&caseId=TCGA-A2-A04U'
                );
                waitForPatientView();
                var filterIcon = $('div[data-test=patientview-copynumber-table]').$(
                    'i[data-test=gene-filter-icon]'
                );
                assert(!filterIcon.isVisible());
            });
        });

        describe('genomic tracks', () => {
            before(() => {
                goToUrlAndSetLocalStorage(patienViewUrl);
                waitForPatientView();
            });

            it('shows gene panel icon when gene panels are used for patient samples', () => {
                assert($('[data-test=cna-track-genepanel-icon-0]').isExisting());
                assert($('[data-test=mut-track-genepanel-icon-5]').isExisting());
            });

            it('shows mouse-over tooltip for gene panel icons with gene panel id', () => {
                // Tooltip elements are created when hovering the gene panel icon.
                // Control logic below is needed to access the last one after it
                // was created.
                var curNumToolTips = $$('div.qtip-content').length;
                browser.moveToObject('[data-test=cna-track-genepanel-icon-1]');
                browser.waitUntil(() => $$('div.qtip-content').length > curNumToolTips);
                var toolTips = $$('div.qtip-content');
                var text = toolTips[toolTips.length - 1].getText();
                assert.equal(text, 'Gene panel: TESTPANEL1');
            });

            it('shows mouse-over tooltip for gene panel icons with NA for whole-genome analyzed sample', () => {
                // Tooltip elements are created when hovering the gene panel icon.
                // Control logic below is needed to access the last one after it
                // was created.
                var curNumToolTips = $$('div.qtip-content').length;
                browser.moveToObject('[data-test=cna-track-genepanel-icon-4]');
                browser.waitUntil(() => $$('div.qtip-content').length > curNumToolTips);
                var toolTips = $$('div.qtip-content');
                var text = toolTips[toolTips.length - 1].getText();
                assert.equal(
                    text,
                    'Gene panel information not found. Sample is presumed to be whole exome/genome sequenced.'
                );
            });

            it('hides gene panel icons when no gene panels are used for patient samples', () => {
                goToUrlAndSetLocalStorage(
                    CBIOPORTAL_URL + '/patient?studyId=study_es_0&caseId=TCGA-A1-A0SK'
                );
                waitForPatientView();
                assert(!$('[data-test=mut-track-genepanel-icon-0]').isExisting());
            });
        });

        describe('VAF plot', () => {
            before(() => {
                goToUrlAndSetLocalStorage(patienViewUrl);
                waitForPatientView();
            });

            it('shows gene panel icons when gene panels are used', () => {
                browser.moveToObject('svg[data-test=vaf-plot]'); // moves pointer to plot thumbnail
                $('div[role=tooltip] svg[data-test=vaf-plot]').waitForVisible();
                var genePanelIcon = $('svg[data-test=vaf-plot] rect.genepanel-icon');
                assert(genePanelIcon.isExisting());
            });
        });

        describe('gene panel modal', () => {
            function clickOnGenePanelLinks() {
                const genePanelLinks = $$('.rc-tooltip table td a');
                genePanelLinks[genePanelLinks.length - 1].click();
            }

            beforeEach(() => {
                goToUrlAndSetLocalStorage(patienViewUrl);
                waitForPatientView();
            });

            it('toggles gene panel modal from patient header', () => {
                browser.moveToObject('.patientSamples .clinical-spans svg').pause(500);
                clickOnGenePanelLinks();
                assert($('#patient-view-gene-panel').isExisting());
            });

            it('toggles gene panel modal from sample icon in genomic tracks', () => {
                browser
                    .moveToObject('.genomicOverviewTracksContainer svg[data-test=sample-icon]')
                    .pause(500);
                clickOnGenePanelLinks();
                assert($('#patient-view-gene-panel').isExisting());
            });

            it('toggles gene panel modal from gene panel icon in genomic tracks', () => {
                browser
                    .moveToObject(
                        '.genomicOverviewTracksContainer [data-test=cna-track-genepanel-icon-0]'
                    )
                    .pause(500);
                $('.qtip-content a').click();
                assert($('#patient-view-gene-panel').isExisting());
            });

            it('toggles gene panel modal from sample icon in mutations table', () => {
                const mutationsTable = '[data-test=patientview-mutation-table]';
                browser
                    .moveToObject(`${mutationsTable} table td [data-test=not-profiled-icon]`)
                    .pause(500);
                clickOnGenePanelLinks();
                assert($('#patient-view-gene-panel').isExisting());
            });

            it('toggles gene panel modal from gene panel id in mutations table', () => {
                const mutationsTable = '[data-test=patientview-mutation-table]';

                // select option to show "Gene Panel" column
                $(`${mutationsTable} button#dropdown-custom-1`).click();
                $(`${mutationsTable} ul.dropdown-menu`)
                    .$$('li')[2]
                    .click();

                // click on gene panel id in mutations table
                $(`${mutationsTable} table a`).click();
                assert($('#patient-view-gene-panel').isExisting());
            });

            it('toggles gene panel modal from sample icon in copy number table', () => {
                const copyNumberTable = '[data-test=patientview-copynumber-table]';
                browser
                    .moveToObject(`${copyNumberTable} table td [data-test=not-profiled-icon]`)
                    .pause(500);
                clickOnGenePanelLinks();
                assert($('#patient-view-gene-panel').isExisting());
            });

            it('toggles gene panel modal from gene panel id in copy number table', () => {
                const copyNumberTable = '[data-test=patientview-copynumber-table]';

                // select option to show "Gene Panel" column
                $(`${copyNumberTable} button#dropdown-custom-1`).click();
                $(`${copyNumberTable} ul.dropdown-menu`)
                    .$$('li')[2]
                    .click();

                // click on gene panel id in copy number table
                $(`${copyNumberTable} table a`).click();
                assert($('#patient-view-gene-panel').isExisting());
            });
        });
    }
});

function testSampleIcon(geneSymbol, tableTag, sampleIconTypes, sampleVisibilities) {
    const geneCell = $('div[data-test=' + tableTag + '] table').$('span=' + geneSymbol);
    const samplesCell = geneCell
        .$('..')
        .$('..')
        .$('div[data-test=samples-cell] ul');
    const icons = samplesCell.$$('li');

    sampleIconTypes.forEach((desiredDataType, i) => {
        const isExpectedIcon = icons[i].$('svg[data-test=' + desiredDataType + ']').isExisting();
        assert.equal(
            isExpectedIcon,
            true,
            'Gene ' +
                geneSymbol +
                ': icon type at position ' +
                i +
                ' is not `' +
                desiredDataType +
                '`'
        );
    });

    sampleVisibilities.forEach((desiredVisibility, i) => {
        const actualVisibility = icons[i].isVisible();
        assert.equal(
            actualVisibility,
            desiredVisibility,
            'Gene ' +
                geneSymbol +
                ': icon visibility at position ' +
                i +
                ' is not `' +
                desiredVisibility +
                '`, but is `' +
                actualVisibility +
                '`'
        );
    });
}

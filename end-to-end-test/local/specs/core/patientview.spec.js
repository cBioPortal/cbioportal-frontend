var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var useExternalFrontend = require('../../../shared/specUtils')
    .useExternalFrontend;
var waitForPatientView = require('../../../shared/specUtils')
    .waitForPatientView;
var {
    jsApiHover,
    setDropdownOpen,
    strIsNumeric,
    jq,
} = require('../../../shared/specUtils');

var _ = require('lodash');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const genePanelPatientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=teststudy_genepanels&caseId=patientA';
const ascnPatientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=ascn_test_study&caseId=FAKE_P001';

const ALLELE_FREQ_CELL_DATA_TEST = 'allele-freq-cell';
const ALLELE_FREQ_PATIENT_VIEW_URL = `${CBIOPORTAL_URL}/patient?studyId=ascn_test_study&caseId=FAKE_P001`;
const ALLELE_FREQ_SAMPLE_VIEW_URL = `${CBIOPORTAL_URL}/patient?studyId=ascn_test_study&sampleId=FAKE_P001_S3`;

describe('patient view page', function() {
    describe('gene panel information', () => {
        before(() => {
            goToUrlAndSetLocalStorage(genePanelPatientViewUrl, true);
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
            goToUrlAndSetLocalStorage(genePanelPatientViewUrl, true);
            waitForPatientView();
        });

        it('filter menu icon is shown when gene panels are used', () => {
            filterIcon = $('div[data-test=patientview-mutation-table]').$(
                'i[data-test=gene-filter-icon]'
            );
            assert(filterIcon.isDisplayed());
        });

        it('opens selection menu when filter icon clicked', () => {
            setDropdownOpen(true, filterIcon, '.rc-tooltip');
            selectMenu = $('.rc-tooltip');
            assert(selectMenu.isDisplayed());
        });

        it('removes genes profiles profiled in some samples then `all genes` option selected', () => {
            setDropdownOpen(true, filterIcon, selectMenu);
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
            setDropdownOpen(false, filterIcon, '.rc-tooltip');
            selectMenu = $('.rc-tooltip');
            assert(!selectMenu.isDisplayed());
        });

        it('filter menu icon is not shown when gene panels are not used', () => {
            goToUrlAndSetLocalStorage(
                CBIOPORTAL_URL +
                    '/patient?studyId=study_es_0&caseId=TCGA-A1-A0SK',
                true
            );
            waitForPatientView();
            var filterIcon = $('div[data-test=patientview-mutation-table]').$(
                'i[data-test=gene-filter-icon]'
            );
            assert(!filterIcon.isDisplayed());
        });
    });

    describe('filtering of CNA table', () => {
        let selectMenu;
        let filterIcon;

        before(() => {
            goToUrlAndSetLocalStorage(genePanelPatientViewUrl, true);
            waitForPatientView();
        });

        it('filter menu icon is shown when gene panels are used', () => {
            filterIcon = $('div[data-test=patientview-copynumber-table]').$(
                'i[data-test=gene-filter-icon]'
            );
            assert(filterIcon.isDisplayed());
        });

        it('opens selection menu when filter icon clicked', () => {
            setDropdownOpen(true, filterIcon, '.rc-tooltip');
            selectMenu = $('.rc-tooltip');
            assert(selectMenu.isDisplayed());
        });

        it('removes genes profiles profiled in some samples then `all genes` option selected', () => {
            setDropdownOpen(true, filterIcon, '.rc-tooltip');
            const allGenesRadio = selectMenu.$('input[value=allSamples]');
            allGenesRadio.click();
            const geneEntries = $$('[data-test=cna-table-gene-column]');
            assert.equal(geneEntries.length, 1);
            const geneName = geneEntries[0].getText();
            assert.equal(geneName, 'CADM2');
        });

        it('re-adds genes when `any genes` option selected', () => {
            setDropdownOpen(true, filterIcon, '.rc-tooltip');
            const anyGenesRadio = selectMenu.$('input[value=anySample]');
            anyGenesRadio.click();
            const geneEntries = $$('[data-test=cna-table-gene-column]');
            assert.equal(geneEntries.length, 3);
        });

        it('closes selection menu when filter icon clicked again', () => {
            setDropdownOpen(false, filterIcon, '.rc-tooltip');
            assert(!selectMenu.isDisplayed());
        });

        it('filter menu icon is not shown when gene panels are not used', () => {
            goToUrlAndSetLocalStorage(
                CBIOPORTAL_URL +
                    '/patient?studyId=study_es_0&caseId=TCGA-A2-A04U',
                true
            );
            waitForPatientView();
            var filterIcon = $('div[data-test=patientview-copynumber-table]').$(
                'i[data-test=gene-filter-icon]'
            );
            assert(!filterIcon.isDisplayed());
        });
    });

    describe('genomic tracks', () => {
        before(() => {
            goToUrlAndSetLocalStorage(genePanelPatientViewUrl, true);
            waitForPatientView();
        });

        it.skip('shows gene panel icon when gene panels are used for patient samples', () => {
            assert($('[data-test=cna-track-genepanel-icon-0]').isExisting());
            assert($('[data-test=mut-track-genepanel-icon-5]').isExisting());
        });

        it.skip('shows mouse-over tooltip for gene panel icons with gene panel id', () => {
            // Tooltip elements are created when hovering the gene panel icon.
            // Control logic below is needed to access the last one after it
            // was created.

            $('[data-test=cna-track-genepanel-icon-1]').waitForDisplayed();

            $('[data-test=cna-track-genepanel-icon-1]').moveTo();

            $('.genover-tooltip').waitForDisplayed();
            var text = $('div.qtip-content').getText();
            assert.equal(text, 'Gene panel: TESTPANEL1');
        });

        it.skip('shows mouse-over tooltip for gene panel icons with NA for whole-genome analyzed sample', () => {
            // Tooltip elements are created when hovering the gene panel icon.
            // Control logic below is needed to access the last one after it
            // was created.
            var curNumToolTips = $$('div.qtip-content').length;
            $('[data-test=cna-track-genepanel-icon-4]').moveTo();
            browser.waitUntil(
                () => $$('div.qtip-content').length > curNumToolTips
            );
            var toolTips = $$('div.qtip-content');
            var text = toolTips[toolTips.length - 1].getText();
            assert.equal(
                text,
                'Gene panel information not found. Sample is presumed to be whole exome/genome sequenced.'
            );
        });

        it('hides gene panel icons when no gene panels are used for patient samples', () => {
            goToUrlAndSetLocalStorage(
                CBIOPORTAL_URL +
                    '/patient?studyId=study_es_0&caseId=TCGA-A1-A0SK',
                true
            );
            waitForPatientView();
            assert(!$('[data-test=mut-track-genepanel-icon-0]').isExisting());
        });
    });

    describe('VAF plot', () => {
        before(() => {
            goToUrlAndSetLocalStorage(genePanelPatientViewUrl, true);
            waitForPatientView();
        });

        it('shows gene panel icons when gene panels are used', () => {
            $('.vafPlotThumbnail').moveTo(); // moves pointer to plot thumbnail
            $('div[role=tooltip] svg[data-test=vaf-plot]').waitForDisplayed();
            var genePanelIcon = $(
                'svg[data-test=vaf-plot] rect.genepanel-icon'
            );
            assert(genePanelIcon.isExisting());
        });
    });

    describe('gene panel modal', () => {
        function clickOnGenePanelLinks() {
            const el = $('.rc-tooltip td a');
            el.waitForDisplayed();
            el.click();
        }

        beforeEach(() => {
            goToUrlAndSetLocalStorage(genePanelPatientViewUrl, true);
            waitForPatientView();
        });

        it('toggles gene panel modal from patient header', () => {
            $('.patientSamples .clinical-spans svg').moveTo();

            clickOnGenePanelLinks();

            assert($('#patient-view-gene-panel').waitForDisplayed());
        });

        it.skip('toggles gene panel modal from sample icon in genomic tracks', () => {
            $(
                '.genomicOverviewTracksContainer svg[data-test=sample-icon]'
            ).moveTo();

            clickOnGenePanelLinks();
            assert($('#patient-view-gene-panel').waitForDisplayed());
        });

        it.skip('toggles gene panel modal from gene panel icon in genomic tracks', () => {
            $(
                '.genomicOverviewTracksContainer [data-test=cna-track-genepanel-icon-0]'
            ).moveTo();

            $('.qtip-content a').click();
            assert($('#patient-view-gene-panel').waitForDisplayed());
        });

        it('toggles gene panel modal from sample icon in mutations table', () => {
            const mutationsTable = '[data-test=patientview-mutation-table]';
            $(
                `${mutationsTable} table td li:not(.invisible) [data-test=not-profiled-icon]`
            ).moveTo();
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
            jsApiHover(
                `${copyNumberTable} table td li:not(.invisible) [data-test=not-profiled-icon]`
            );
            browser.pause(500);
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

    describe('mutation table ASCN columns', () => {
        before(() => {
            goToUrlAndSetLocalStorage(ascnPatientViewUrl, true);
            waitForPatientView();
            const mutationsTable = '[data-test=patientview-mutation-table]';
            $(`${mutationsTable} button#dropdown-custom-1`).click();
            $(`${mutationsTable} ul.dropdown-menu`)
                .$$('li label input')[21]
                .click();
            $(`${mutationsTable} ul.dropdown-menu`)
                .$$('li label input')[22]
                .click();
            $(`${mutationsTable} ul.dropdown-menu`)
                .$$('li label input')[23]
                .click();
            $(`${mutationsTable} button#dropdown-custom-1`).click();
        });

        afterEach(() => {
            // move somewhere safe so that all tooltips close or open tooltips block others from opening
            $('body').moveTo({ xOffset: 0, yOffset: 0 }); // offset 0, 0 relative to the top-left corner of the element
            browser.pause(200); // it takes a bit of time to close the tooltip after moving
        });

        const c = 'clonal-icon';
        const s = 'subclonal-icon';
        const n = 'na-icon';

        it('shows correct clonal icons, subclonal icons, NA/indeterminate icons, and invisible icons', () => {
            // make sure the gene of the first row is PIK3R1
            const gene = browser.execute(function() {
                return $('[data-test=patientview-mutation-table] tbody tr')
                    .first()
                    .find(
                        '[data-test=mutation-table-gene-column]'
                    )[0].innerText;
            });

            assert.equal(gene, 'PIK3R1');

            const clonalCells = browser.execute(function() {
                return $('[data-test=patientview-mutation-table] tbody tr')
                    .first()
                    .find('[data-test=clonal-cell] svg[data-test]')
                    .toArray()
                    .map(e => e.getAttribute('data-test'));
            });

            assert.equal(
                clonalCells.join(','),
                'clonal-icon,subclonal-icon,na-icon,clonal-icon,clonal-icon,na-icon'
            );

            const sampleVisiblity = browser.execute(function() {
                return $('[data-test=patientview-mutation-table] tbody tr')
                    .first()
                    .find('td:first-child li')
                    .toArray()
                    .map(e => e.className);
            });

            assert.deepStrictEqual(sampleVisiblity, [
                '',
                '',
                'invisible',
                '',
                '',
                'invisible',
            ]);
        });

        it('displays clonal column tooltip on mouseover element', () => {
            jsApiHover('span[data-test=clonal-cell] span span svg circle');
            $('div[role=tooltip] div[data-test=clonal-tooltip]').waitForExist();
        });

        it('displays expected alt copies column tooltip on mouseover element', () => {
            jsApiHover('span[data-test=eac-cell] span span svg g rect');
            $('div[role=tooltip] span[data-test=eac-tooltip]').waitForExist();
        });

        it('displays integer copy number column tooltip on mouseover element', () => {
            jsApiHover(
                'span[data-test=ascn-copy-number-cell] span span svg g rect'
            );
            $(
                'div[role=tooltip] span[data-test=ascn-copy-number-tooltip]'
            ).waitForExist();
        });

        it('displays ccf column tooltip on mouseover element', () => {
            jsApiHover('span[data-test=ccf-cell] span');
            $('div[role=tooltip] span[data-test=ccf-tooltip]').waitForExist();
        });
    });

    describe('allele frequency', () => {
        it('should show number under allele frequency column for multiple samples patient in one sample view', function() {
            goToUrlAndSetLocalStorage(ALLELE_FREQ_SAMPLE_VIEW_URL, true);
            waitForPatientView();

            assert.strictEqual(
                true,
                strIsNumeric(
                    $$(`div[data-test="${ALLELE_FREQ_CELL_DATA_TEST}"]`)[0]
                        .$('span')
                        .getText()
                )
            );
        });

        it('should show bars(svg) under allele frequency column for multiple samples patient in patient view', function() {
            goToUrlAndSetLocalStorage(ALLELE_FREQ_PATIENT_VIEW_URL, true);
            waitForPatientView();
            assert.strictEqual(
                true,
                $$(`div[data-test="${ALLELE_FREQ_CELL_DATA_TEST}"]`)[0]
                    .$('svg')
                    .isExisting()
            );
        });
    });
});

function testSampleIcon(
    geneSymbol,
    tableTag,
    sampleIconTypes,
    sampleVisibilities
) {
    const geneCell = $('div[data-test=' + tableTag + '] table').$(
        'span=' + geneSymbol
    );
    const samplesCell = geneCell
        .$('..')
        .$('..')
        .$('div[data-test=samples-cell] ul');
    const icons = samplesCell.$$('li');

    sampleIconTypes.forEach((desiredDataType, i) => {
        const isExpectedIcon = icons[i]
            .$('svg[data-test=' + desiredDataType + ']')
            .isExisting();
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
        const actualVisibility = icons[i].isDisplayed();
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

var assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
} = require('../../shared/specUtils');
var goToUrlAndSetLocalStorage = require('../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var useExternalFrontend = require('../../shared/specUtils').useExternalFrontend;
var waitForStudyView = require('../../shared/specUtils').waitForStudyView;
var waitForComparisonTab = require('../../shared/specUtils')
    .waitForComparisonTab;
var openAlterationTypeSelectionMenu = require('../../shared/specUtils')
    .openAlterationTypeSelectionMenu;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=study_es_0`;
const comparisonResultsViewUrl = `${CBIOPORTAL_URL}/results/comparison?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=study_es_0_cnaseq&gene_list=ABLIM1%2520TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit&comparison_subtab=alterations`;
const selectSamplesButton = 'button=Select Samples';

// Note: not all SV elements outside of visible area are rendered:
const SV_COUNTS_SORT_DESC_10 = {
    BRAF: '37',
    SND1: '10',
    AGK: '4',
    ALK: '4',
    TTN: '4',
    MKRN1: '2',
    AGAP3: '2',
    TMPRSS2: '2',
    EML4: '2',
    CDK5RAP2: '2',
};

/**
 * For filtering of Structural Variants, see also: custom-driver-annotations-in-study-view.spec.js
 */
describe('alteration filter menu', function() {
    describe('study view', () => {
        describe('filtering of gene tables', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorageWithProperty(studyViewUrl, true, {
                    /**
                     * Only use custom driver annotations from local db:
                     */
                    show_oncokb: false,
                });
                waitForStudyView();
                turnOffCancerGenesFilters();
                openAlterationFilterMenu();
            });

            // -+=+ MUTATION STATUS +=+-
            it('filters mutation table when unchecking somatic checkbox', () => {
                clickCheckBoxStudyView('Somatic');
                assert.deepStrictEqual(geneTableCounts('mutations-table'), {
                    BRCA2: '6',
                    BRCA1: '1',
                    ATM: '1',
                    TP53: '1',
                });
                // somatic checkbox unchecked, filter structural variant table
                assert.strictEqual(
                    Object.keys(geneTableCounts('structural variants-table'))
                        .length,
                    0
                );
                // does not filter cna table
                assert.deepStrictEqual(
                    geneTableCounts('copy number alterations-table'),
                    {
                        ERCC5_AMP: '7',
                        AURKAIP1_AMP: '7',
                        ATAD3A_AMP: '7',
                        ATAD3B_AMP: '7',
                        ACAP3_AMP: '7',
                        ATAD3C_AMP: '7',
                        AGRN_AMP: '7',
                        ERCC5_HOMDEL: '2',
                        AURKAIP1_HOMDEL: '2',
                        ATAD3A_HOMDEL: '2',
                        ATAD3B_HOMDEL: '2',
                        ACAP3_HOMDEL: '2',
                        ATAD3C_HOMDEL: '2',
                        AGRN_HOMDEL: '2',
                    }
                );
            });

            it('filters mutation table when unchecking germline checkbox', () => {
                clickCheckBoxStudyView('Germline');
                assert.deepStrictEqual(geneTableCounts('mutations-table'), {
                    BRCA2: '6',
                    ACP3: '5',
                    BRCA1: '4',
                    ATM: '1',
                    DTNB: '1',
                    ABLIM1: '1',
                    MSH3: '1',
                    MYB: '1',
                    TP53: '1',
                    PIEZO1: '1',
                    ADAMTS20: '1',
                    OR11H1: '1',
                    TMEM247: '1',
                });
                // does not filter structural variant table
                // (sort and take top ten, as react does not render all rows)
                sortPaneByCount('structural variants-table');
                assert.deepStrictEqual(
                    sortDescLimit(geneTableCounts('structural variants-table')),
                    SV_COUNTS_SORT_DESC_10
                );
                // does not filter cna table
                assert.deepStrictEqual(
                    geneTableCounts('copy number alterations-table'),
                    {
                        ERCC5_AMP: '7',
                        AURKAIP1_AMP: '7',
                        ATAD3A_AMP: '7',
                        ATAD3B_AMP: '7',
                        ACAP3_AMP: '7',
                        ATAD3C_AMP: '7',
                        AGRN_AMP: '7',
                        ERCC5_HOMDEL: '2',
                        AURKAIP1_HOMDEL: '2',
                        ATAD3A_HOMDEL: '2',
                        ATAD3B_HOMDEL: '2',
                        ACAP3_HOMDEL: '2',
                        ATAD3C_HOMDEL: '2',
                        AGRN_HOMDEL: '2',
                    }
                );
            });

            it('does not filter mutation table when unchecking unknown status checkbox', () => {
                //NOTE this is failing because somatic status filtering appears not to
                // work on SVs where it once did
                // this is probably because SVs were mutations
                // it apparently regarded them as UNKNOWN, now they are KNOWN
                // FILL IN NUMBER OF SVs
                $('[data-test=ShowUnknown]').click();
                waitForStudyView();
                assert.deepStrictEqual(geneTableCounts('mutations-table'), {
                    BRCA2: '12',
                    ACP3: '5',
                    BRCA1: '5',
                    ATM: '2',
                    DTNB: '1',
                    ABLIM1: '1',
                    MSH3: '1',
                    MYB: '1',
                    TP53: '2',
                    PIEZO1: '1',
                    ADAMTS20: '1',
                    OR11H1: '1',
                    TMEM247: '1',
                });
                // does not filter structural variant table
                // (take top ten, as react does not render all rows)
                assert.deepStrictEqual(
                    sortDescLimit(geneTableCounts('structural variants-table')),
                    SV_COUNTS_SORT_DESC_10
                );
                // does not filter cna table
                assert.deepStrictEqual(
                    geneTableCounts('copy number alterations-table'),
                    {
                        ERCC5_AMP: '7',
                        AURKAIP1_AMP: '7',
                        ATAD3A_AMP: '7',
                        ATAD3B_AMP: '7',
                        ACAP3_AMP: '7',
                        ATAD3C_AMP: '7',
                        AGRN_AMP: '7',
                        ERCC5_HOMDEL: '2',
                        AURKAIP1_HOMDEL: '2',
                        ATAD3A_HOMDEL: '2',
                        ATAD3B_HOMDEL: '2',
                        ACAP3_HOMDEL: '2',
                        ATAD3C_HOMDEL: '2',
                        AGRN_HOMDEL: '2',
                    }
                );
            });

            // -+=+ DRIVER ANNOTATIONS +=+-
            it('filters tables when unchecking driver checkbox', () => {
                clickCheckBoxStudyView('Putative drivers');
                assert.deepStrictEqual(geneTableCounts('mutations-table'), {
                    BRCA2: '12',
                    ACP3: '5',
                    BRCA1: '3',
                    PIEZO1: '1',
                    ATM: '2',
                    TP53: '2',
                    ADAMTS20: '1',
                    TMEM247: '1',
                    DTNB: '1',
                    MSH3: '1',
                    MYB: '1',
                });

                assert.deepStrictEqual(
                    geneTableCounts('copy number alterations-table'),
                    {
                        AURKAIP1_AMP: '7',
                        ATAD3A_AMP: '7',
                        ATAD3B_AMP: '7',
                        ACAP3_AMP: '7',
                        ATAD3C_AMP: '7',
                        ERCC5_AMP: '6',
                        AGRN_AMP: '6',
                        AURKAIP1_HOMDEL: '2',
                        ATAD3A_HOMDEL: '2',
                        ATAD3B_HOMDEL: '2',
                        ACAP3_HOMDEL: '2',
                        ATAD3C_HOMDEL: '2',
                        AGRN_HOMDEL: '2',
                        ERCC5_HOMDEL: '1',
                    }
                );
            });

            it('filters tables when unchecking passenger checkbox', () => {
                clickCheckBoxStudyView('Putative passengers');
                assert.deepStrictEqual(geneTableCounts('mutations-table'), {
                    BRCA2: '12',
                    ACP3: '5',
                    BRCA1: '4',
                    ATM: '2',
                    ABLIM1: '1',
                    TP53: '2',
                    ADAMTS20: '1',
                    OR11H1: '1',
                });

                // For Structural Variants: see custom-driver-annotations-in-study-view.spec.js

                assert.deepStrictEqual(
                    geneTableCounts('copy number alterations-table'),
                    {
                        ERCC5_AMP: '7',
                        AURKAIP1_AMP: '7',
                        ATAD3A_AMP: '7',
                        ATAD3B_AMP: '7',
                        ACAP3_AMP: '6',
                        ATAD3C_AMP: '6',
                        AGRN_AMP: '7',
                        ERCC5_HOMDEL: '2',
                        AURKAIP1_HOMDEL: '2',
                        ATAD3A_HOMDEL: '2',
                        ATAD3B_HOMDEL: '2',
                        ACAP3_HOMDEL: '2',
                        ATAD3C_HOMDEL: '2',
                        AGRN_HOMDEL: '2',
                    }
                );
            });

            it('filters tables when unchecking when unchecking unknown oncogenicity checkbox', () => {
                $('[data-test=ShowUnknownOncogenicity]').click();
                waitForStudyView();
                assert.deepStrictEqual(geneTableCounts('mutations-table'), {
                    BRCA1: '3',
                    PIEZO1: '1',
                    DTNB: '1',
                    ABLIM1: '1',
                    MSH3: '1',
                    MYB: '1',
                    OR11H1: '1',
                    TMEM247: '1',
                });

                // For Structural Variants: see custom-driver-annotations-in-study-view.spec.js

                assert.deepStrictEqual(
                    geneTableCounts('copy number alterations-table'),
                    {
                        ERCC5_AMP: '1',
                        ACAP3_AMP: '1',
                        ATAD3C_AMP: '1',
                        AGRN_AMP: '1',
                        ERCC5_HOMDEL: '1',
                    }
                );
            });

            it('filters structural variant tables when unchecking when unchecking somatic oncogenicity checkbox', () => {
                $('[data-test=HideSomatic]').click();
                waitForStudyView();
                assert.strictEqual(
                    Object.keys(geneTableCounts('structural variants-table'))
                        .length,
                    0
                );
            });

            // -+=+ TIER ANNOTATIONS +=+-
            it('does not filter tables when checking all tier checkboxes', () => {
                waitForStudyView();
                assert.deepStrictEqual(geneTableCounts('mutations-table'), {
                    BRCA2: '12',
                    ACP3: '5',
                    BRCA1: '5',
                    ATM: '2',
                    DTNB: '1',
                    ABLIM1: '1',
                    MSH3: '1',
                    MYB: '1',
                    TP53: '2',
                    PIEZO1: '1',
                    ADAMTS20: '1',
                    OR11H1: '1',
                    TMEM247: '1',
                });

                // For Structural Variants: see custom-driver-annotations-in-study-view.spec.js

                assert.deepStrictEqual(
                    geneTableCounts('copy number alterations-table'),
                    {
                        ERCC5_AMP: '7',
                        AURKAIP1_AMP: '7',
                        ATAD3A_AMP: '7',
                        ATAD3B_AMP: '7',
                        ACAP3_AMP: '7',
                        ATAD3C_AMP: '7',
                        AGRN_AMP: '7',
                        ERCC5_HOMDEL: '2',
                        AURKAIP1_HOMDEL: '2',
                        ATAD3A_HOMDEL: '2',
                        ATAD3B_HOMDEL: '2',
                        ACAP3_HOMDEL: '2',
                        ATAD3C_HOMDEL: '2',
                        AGRN_HOMDEL: '2',
                    }
                );
            });

            it('filters tables when checking only Class 1 checkbox', () => {
                selectTier('Class_1');
                waitForStudyView();
                assert.deepStrictEqual(geneTableCounts('mutations-table'), {
                    BRCA1: '3',
                    ABLIM1: '1',
                    DTNB: '1',
                });

                assert.deepStrictEqual(
                    geneTableCounts('copy number alterations-table'),
                    {
                        ATAD3B_HOMDEL: '1',
                        AGRN_AMP: '1',
                    }
                );
            });

            it('filters tables when checking only Class 2 checkbox', () => {
                selectTier('Class_2');

                assert.deepStrictEqual(geneTableCounts('mutations-table'), {
                    TMEM247: '1',
                });

                assert.deepStrictEqual(
                    geneTableCounts('structural variants-table'),
                    { ALK: '1', EML4: '1' }
                );

                assert.deepStrictEqual(
                    geneTableCounts('copy number alterations-table'),
                    {
                        ATAD3A_HOMDEL: '1',
                        ACAP3_AMP: '1',
                    }
                );
            });

            it('filters tables when checking only Class 3 checkbox', () => {
                selectTier('Class_3');
                waitForStudyView();
                assert.deepStrictEqual(geneTableCounts('mutations-table'), {
                    MSH3: '1',
                    PIEZO1: '1',
                });

                assert.deepStrictEqual(
                    geneTableCounts('structural variants-table'),
                    { NCOA4: '1', RET: '1' }
                );

                assert.strictEqual(
                    Object.keys(
                        geneTableCounts('copy number alterations-table')
                    ).length,
                    0
                );
            });

            it('filters tables when checking only Class 4 checkbox', () => {
                selectTier('Class_4');
                waitForStudyView();
                assert.deepStrictEqual(geneTableCounts('mutations-table'), {
                    ADAMTS20: '1',
                });

                assert.deepStrictEqual(
                    geneTableCounts('structural variants-table'),
                    {
                        KIAA1549: '1',
                        BRAF: '1',
                        NCOA4: '1',
                        PIEZO1: '1',
                    }
                );

                assert.strictEqual(
                    Object.keys(
                        geneTableCounts('copy number alterations-table')
                    ).length,
                    0
                );
            });

            it('filters tables when checking only unknown tier checkbox', () => {
                selectTier('ShowUnknownTier');
                waitForStudyView();
                assert.deepStrictEqual(geneTableCounts('mutations-table'), {
                    BRCA2: '12',
                    ACP3: '5',
                    ATM: '2',
                    BRCA1: '2',
                    TP53: '2',
                    MYB: '1',
                    OR11H1: '1',
                });

                sortPaneByCount('structural variants-table');
                assert.deepStrictEqual(
                    sortDescLimit(
                        geneTableCounts('structural variants-table'),
                        8
                    ),
                    {
                        BRAF: '36',
                        SND1: '10',
                        AGK: '4',
                        ALK: '3',
                        TTN: '4',
                        MKRN1: '2',
                        AGAP3: '2',
                        CDK5RAP2: '2',
                    }
                );
                assert.deepStrictEqual(
                    geneTableCounts('copy number alterations-table'),
                    {
                        ERCC5_AMP: '7',
                        AURKAIP1_AMP: '7',
                        ATAD3A_AMP: '7',
                        ATAD3B_AMP: '7',
                        ATAD3C_AMP: '7',
                        ACAP3_AMP: '6',
                        AGRN_AMP: '6',
                        ERCC5_HOMDEL: '2',
                        AURKAIP1_HOMDEL: '2',
                        ACAP3_HOMDEL: '2',
                        ATAD3C_HOMDEL: '2',
                        AGRN_HOMDEL: '2',
                        ATAD3B_HOMDEL: '1',
                        ATAD3A_HOMDEL: '1',
                    }
                );
            });
        });

        describe('filtering of study view samples', () => {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(studyViewUrl, true);
                waitForStudyView();
                turnOffCancerGenesFilters();
                openAlterationFilterMenu();
            });

            it('adds breadcrumb text for mutations', () => {
                clickCheckBoxStudyView('Somatic');
                clickCheckBoxStudyView('Putative passengers');
                $('[data-test=ToggleAllDriverTiers]').click();
                $('[data-test=ShowUnknownTier]').click();
                waitForStudyView();
                $('//*[@data-test="mutations-table"]')
                    .$('input')
                    .click();
                $('//*[@data-test="mutations-table"]')
                    .$('button=Select Samples')
                    .click();
                var sections = $('[data-test=groupedGeneFilterIcons]').$$(
                    'div'
                );
                assert.strictEqual(
                    sections[0].$$('span')[1].getText(),
                    'driver or unknown'
                );
                assert.strictEqual(
                    sections[1].$$('span')[1].getText(),
                    'germline or unknown'
                );
                assert.strictEqual(
                    sections[2].$$('span')[1].getText(),
                    'unknown'
                );
            });

            it('adds breadcrumb text for cnas', () => {
                // does not include the mutation status settings
                clickCheckBoxStudyView('Somatic');
                clickCheckBoxStudyView('Putative drivers');
                $('//*[@data-test="copy number alterations-table"]')
                    .$('input')
                    .click();
                $('//*[@data-test="copy number alterations-table"]')
                    .$('button=Select Samples')
                    .click();
                var sections = $('[data-test=groupedGeneFilterIcons]').$$(
                    'div'
                );
                assert.strictEqual(sections.length, 1);
                assert.strictEqual(
                    sections[0].$$('span')[1].getText(),
                    'passenger or unknown'
                );
            });

            it('reduced samples in genes table', () => {
                clickCheckBoxStudyView('Somatic');
                clickCheckBoxStudyView('Putative passengers');
                $('//*[@data-test="mutations-table"]')
                    .$$('input')[1]
                    .click(); // click ATM gene
                $('//*[@data-test="mutations-table"]')
                    .$('button=Select Samples')
                    .click();
                assert.deepStrictEqual(geneTableCounts('mutations-table'), {
                    BRCA2: '1',
                    BRCA1: '1',
                    ATM: '1',
                    TP53: '1',
                });
            });
        });
    });

    describe('group comparison - results view ', () => {
        before(() => {
            goToUrlAndSetLocalStorage(comparisonResultsViewUrl, true);
            waitForComparisonTab();

            // turn off fusion and cna types
            openAlterationTypeSelectionMenu();
            clickCheckBoxResultsView('Structural Variants / Fusions');
            clickCheckBoxResultsView('Copy Number Alterations');
            $('[data-test=buttonSelectAlterations]').click();
            waitForUpdateResultsView();

            openAlterationFilterMenuGroupComparison();
        });

        // -+=+ MUTATION STATUS +=+-
        it('filters enrichment table when unchecking germline checkbox', () => {
            waitForStudyView();
            clickCheckBoxResultsView('Germline');
            assert.deepStrictEqual(enrichmentTableCounts(), {
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '0 (0.00%)', unalt: '6 (30.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            clickCheckBoxResultsView('Germline');
        });

        it('filters enrichment table when unchecking somatic checkbox', () => {
            clickCheckBoxResultsView('Somatic');
            assert.deepStrictEqual(enrichmentTableCounts(), {
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '5 (25.00%)' },
            });
            clickCheckBoxResultsView('Somatic');
        });

        it('filters enrichment table when unchecking unknown status checkbox', () => {
            $('[data-test=ShowUnknown]').click();
            waitForUpdateResultsView();
            assert.deepStrictEqual(enrichmentTableCounts(), {
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            $('[data-test=ShowUnknown]').click();
        });

        // -+=+ DRIVER ANNOTATIONS +=+-
        it('filters enrichment table when unchecking driver checkbox', () => {
            clickCheckBoxResultsView('Putative drivers');
            assert.deepStrictEqual(enrichmentTableCounts(), {
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            clickCheckBoxResultsView('Putative drivers');
        });

        it('filters enrichment table when unchecking passenger checkbox', () => {
            clickCheckBoxResultsView('Putative passengers');
            assert.deepStrictEqual(enrichmentTableCounts(), {
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            clickCheckBoxResultsView('Putative passengers');
        });

        it('filters enrichment table when unchecking unknown oncogenicity checkbox', () => {
            $('[data-test=ShowUnknownOncogenicity]').click();
            waitForUpdateResultsView();
            assert.deepStrictEqual(enrichmentTableCounts(), {
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
            });
            $('[data-test=ShowUnknownOncogenicity]').click();
        });

        // -+=+ TIER ANNOTATIONS +=+-
        it('does not filter tables when checking all tier checkboxes', () => {
            assert.deepStrictEqual(enrichmentTableCounts(), {
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
        });

        it('filters tables when checking Class 2 checkbox', () => {
            // browser.pause(1000_000_000)
            selectTier('Class_2');
            waitForUpdateResultsView();
            assert.deepStrictEqual(enrichmentTableCounts(), {
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
            });
            $('[data-test=Class_2]').click();
        });

        it('filters tables when checking unknown tier checkbox', () => {
            $('[data-test=ShowUnknownTier]').click();
            waitForUpdateResultsView();
            assert.deepStrictEqual(enrichmentTableCounts(), {
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            $('[data-test=ShowUnknownTier]').click();
        });
    });
});

function selectTier(tier) {
    const $toggleAllTiers = $('[data-test=ToggleAllDriverTiers]');
    $toggleAllTiers.waitForExist();
    $toggleAllTiers.waitForClickable();
    $toggleAllTiers.click();
    const $tier = $(`[data-test=${tier}]`);
    $tier.waitForExist();
    $tier.waitForDisplayed();
    $tier.waitForClickable();
    $tier.click();
}

function sortPaneByCount(pane) {
    $('//*[@data-test="' + pane + '"]')
        .$('span=#')
        .click();
    waitForStudyView();
}

var clickCheckBoxStudyView = name => {
    const checkboxContainer = $('label=' + name);
    checkboxContainer.waitForDisplayed();
    const checkboxField = checkboxContainer.$('input');
    checkboxField.waitForDisplayed();
    checkboxField.click();
    waitForStudyView();
};

var sortDescLimit = (entryCounts, limit = 10) => {
    return Object.fromEntries(
        Object.entries(entryCounts)
            .sort((e1, e2) => e1[1] < e2[1])
            .slice(0, limit)
    );
};

var clickCheckBoxResultsView = name => {
    const $el = $('label=' + name).$('input');
    $el.waitForExist();
    $el.waitForDisplayed();
    $el.waitForClickable();
    $el.click();
    waitForUpdateResultsView();
};

var geneTableCounts = dataTest => {
    var fieldName =
        dataTest === 'copy number alterations-table'
            ? 'numberOfAlteredCasesText'
            : 'numberOfAlterations';
    var geneCells = $('//*[@data-test="' + dataTest + '"]').$$(
        '[data-test=geneNameCell]'
    );
    var geneNames = geneCells.map(c => c.$('div').getText());
    var countCells = $('//*[@data-test="' + dataTest + '"]').$$(
        '[data-test=' + fieldName + ']'
    );
    var geneCounts = countCells.map(c => c.getText());
    var cnaCells = $('//*[@data-test="' + dataTest + '"]').$$(
        '[data-test=cnaCell]'
    );
    var cnas = cnaCells.map(c => c.getText());
    return geneNames.reduce((obj, geneName, index) => {
        var suffix = '';
        if (cnas.length > 0) suffix = '_' + cnas[index];
        var key = geneName + suffix;
        return { ...obj, [key]: geneCounts[index] };
    }, {});
};

var enrichmentTableCounts = () => {
    var rows = $('[data-test=LazyMobXTable]')
        .$('tbody')
        .$$('tr');
    var geneNames = rows.map(r =>
        r.$('span[data-test=geneNameCell]').getText()
    );
    var alteredCounts = $$('//*[@data-test="Altered group-CountCell"]').map(r =>
        r.getText()
    );
    var unalteredCounts = $$(
        '//*[@data-test="Unaltered group-CountCell"]'
    ).map(r => r.getText());
    return geneNames.reduce((obj, geneName, index) => {
        return {
            ...obj,
            [geneName]: {
                alt: alteredCounts[index],
                unalt: unalteredCounts[index],
            },
        };
    }, {});
};

var waitForUpdateResultsView = () => {
    $('[data-test=LazyMobXTable]').waitForDisplayed();
};

var turnOffCancerGenesFilters = () => {
    const activeFilterIcons = $$(
        '[data-test=gene-column-header] [data-test=header-filter-icon]'
    ).filter(e => e.getCSSProperty('color').value === 'rgba(0,0,0,1)');
    activeFilterIcons.forEach(i => i.click());
};

var openAlterationFilterMenu = () => {
    $('[data-test=AlterationFilterButton]').waitForDisplayed();
    $('[data-test=AlterationFilterButton]').click();
    $('[data-test=GlobalSettingsDropdown] input').waitForDisplayed();
};

var openAlterationFilterMenuGroupComparison = () => {
    $(
        '[data-test=AlterationEnrichmentAnnotationsSelectorButton]'
    ).waitForDisplayed();
    $('[data-test=AlterationEnrichmentAnnotationsSelectorButton]').click();
    $('[data-test=GlobalSettingsDropdown] input').waitForDisplayed();
};

var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var useExternalFrontend = require('../../../shared/specUtils')
    .useExternalFrontend;
var waitForStudyView = require('../../../shared/specUtils').waitForStudyView;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=study_es_0`;

describe('study view', function() {
    if (useExternalFrontend) {
        describe('alteration filter menu', function() {
            beforeEach(() => {
                goToUrlAndSetLocalStorage(studyViewUrl);
                waitForStudyView();
            });

            it('shows correct number of genes in tables', () => {
                F;
                var numMutatedGenes = $('[data-test=mutations-table]')
                    .$('[role=rowgroup]')
                    .$$('div').length;
                var numFusionGenes = $('[data-test=fusions-table]')
                    .$('[role=rowgroup]')
                    .$$('div').length;
                var numCnaGenes = $(
                    '[data-test="copy number alterations-table"]'
                )
                    .$('[role=rowgroup]')
                    .$$('div').length;
                assert.strictEqual(6, numMutatedGenes);
                assert.strictEqual(2, numFusionGenes);
                assert.strictEqual(2, numCnaGenes);
                var mutatedGenesSampleCounts = $('[data-test=mutations-table]')
                    .$('[role=rowgroup]')
                    .$$('span[data-test=numberOfAlterationsText]');
                assert.strictEqual(12, mutatedGenesSampleCounts[0]);
                assert.strictEqual(1, mutatedGenesSampleCounts[1]);
                assert.strictEqual(2, mutatedGenesSampleCounts[2]);
                assert.strictEqual(1, mutatedGenesSampleCounts[3]);
                assert.strictEqual(1, mutatedGenesSampleCounts[4]);
                assert.strictEqual(2, mutatedGenesSampleCounts[5]);
                var fusionGenesSampleCounts = $('[data-test=fusions-table]')
                    .$('[role=rowgroup]')
                    .$$('span[data-test=numberOfAlterationsText]');
                assert.strictEqual(2, fusionGenesSampleCounts[0]);
                assert.strictEqual(1, fusionGenesSampleCounts[1]);
                var cnaGenesSampleCounts = $(
                    '[data-test="copy number alterations-table"]'
                )
                    .$('[role=rowgroup]')
                    .$$('span[data-test=numberOfAlteredCasesText]');
                assert.strictEqual(7, cnaGenesSampleCounts[0]);
                assert.strictEqual(2, cnaGenesSampleCounts[1]);
            });

            it('removes germline mutations', function() {
                $('[data-test=AlterationFilterButton]').click();
                $('[data-test=HideGermline]').click();
                waitForStudyView();
                var numMutatedGenes = $('[data-test=mutations-table]')
                    .$('[role=rowgroup]')
                    .$$('div').length;
                var numFusionGenes = $('[data-test=fusions-table]')
                    .$('[role=rowgroup]')
                    .$$('div').length;
                var numCnaGenes = $(
                    '[data-test="copy number alterations-table"]'
                )
                    .$('[role=rowgroup]')
                    .$$('div').length;
                assert.strictEqual(6, numMutatedGenes);
                assert.strictEqual(2, numFusionGenes);
                assert.strictEqual(2, numCnaGenes);
                var mutatedGenesSampleCounts = $('[data-test=mutations-table]')
                    .$('[role=rowgroup]')
                    .$$('span[data-test=numberOfAlterationsText]');
                assert.strictEqual(6, mutatedGenesSampleCounts[0]);
                assert.strictEqual(1, mutatedGenesSampleCounts[1]);
                assert.strictEqual(1, mutatedGenesSampleCounts[2]);
                assert.strictEqual(1, mutatedGenesSampleCounts[3]);
                assert.strictEqual(1, mutatedGenesSampleCounts[4]);
                assert.strictEqual(1, mutatedGenesSampleCounts[5]);
                var fusionGenesSampleCounts = $('[data-test=fusions-table]')
                    .$('[role=rowgroup]')
                    .$$('span[data-test=numberOfAlterationsText]');
                assert.strictEqual(2, fusionGenesSampleCounts[0]);
                assert.strictEqual(1, fusionGenesSampleCounts[1]);
                var cnaGenesSampleCounts = $(
                    '[data-test="copy number alterations-table"]'
                )
                    .$('[role=rowgroup]')
                    .$$('span[data-test=numberOfAlteredCasesText]');
                assert.strictEqual(7, cnaGenesSampleCounts[0]);
                assert.strictEqual(2, cnaGenesSampleCounts[1]);
            });

            it('removes germline mutations', function() {
                $('[data-test=AlterationFilterButton]').click();
                $('[data-test=HideGermline]').click();
                waitForStudyView();
                var numMutatedGenes = $('[data-test=mutations-table]')
                    .$('[role=rowgroup]')
                    .$$('div').length;
                var numFusionGenes = $('[data-test=fusions-table]')
                    .$('[role=rowgroup]')
                    .$$('div').length;
                var numCnaGenes = $(
                    '[data-test="copy number alterations-table"]'
                )
                    .$('[role=rowgroup]')
                    .$$('div').length;
                assert.strictEqual(6, numMutatedGenes);
                assert.strictEqual(2, numFusionGenes);
                assert.strictEqual(2, numCnaGenes);
                var mutatedGenesSampleCounts = $('[data-test=mutations-table]')
                    .$('[role=rowgroup]')
                    .$$('span[data-test=numberOfAlterationsText]');
                assert.strictEqual(6, mutatedGenesSampleCounts[0]);
                assert.strictEqual(1, mutatedGenesSampleCounts[1]);
                assert.strictEqual(1, mutatedGenesSampleCounts[2]);
                assert.strictEqual(1, mutatedGenesSampleCounts[3]);
                assert.strictEqual(1, mutatedGenesSampleCounts[4]);
                assert.strictEqual(1, mutatedGenesSampleCounts[5]);
                var fusionGenesSampleCounts = $('[data-test=fusions-table]')
                    .$('[role=rowgroup]')
                    .$$('span[data-test=numberOfAlterationsText]');
                assert.strictEqual(2, fusionGenesSampleCounts[0]);
                assert.strictEqual(1, fusionGenesSampleCounts[1]);
                var cnaGenesSampleCounts = $(
                    '[data-test="copy number alterations-table"]'
                )
                    .$('[role=rowgroup]')
                    .$$('span[data-test=numberOfAlteredCasesText]');
                assert.strictEqual(7, cnaGenesSampleCounts[0]);
                assert.strictEqual(2, cnaGenesSampleCounts[1]);
            });
        });
    }
});

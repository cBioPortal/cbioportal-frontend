var assert = require('assert');
var expect = require('chai').expect;
const fs = require('fs');
const fsExtra = require('fs-extra');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;

const pathToChromeDownloads = '../../chromeDownloads';
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
var downloadsTable = document.querySelector('table').get(0);
// var tag = 'i[data-test="cloudDownload"]';

describe('Downloads tab file download tests', function() {
    before(() => {
        // Clean up the chromeDownloads folder and create a fresh one
        fsExtra.removeSync(pathToChromeDownloads);
        fsExtra.mkdirsSync(pathToChromeDownloads);
        goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/download?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
        );
    });

    it('Download the mutations file', () => {
        var downloadMutationsFile = downloadsTable.rows[1].cells[1];
        browser.Click(downloadMutationsFile);
        assert.equal();
    });

    it('Verify the mutations file was downloaded', () => {
        assert.equal(
            fs.existsSync(pathToChromeDownloads + '/mutations.txt'),
            true
        );
    });
});

var goToUrlAndSetLocalStorage = require('../../../shared/specUtils').goToUrlAndSetLocalStorage;
var waitForOncoprint = require('../../../shared/specUtils').waitForOncoprint;
var assertScreenShotMatch = require('../../../shared/lib/testUtils').assertScreenShotMatch;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");
const ONCOPRINT_TIMEOUT = 60000;

describe("oncoprint screenshot tests", function() {
    it("msk_impact_2017 query STK11:HOMDEL MUT", ()=>{
        goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_Non-Small_Cell_Lung_Cancer&gene_list=STK11%253A%2520HOMDEL%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`);
        waitForOncoprint(ONCOPRINT_TIMEOUT);
        var res = browser.checkElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
});
var waitForOncoprint = require('../../../shared/specUtils').waitForOncoprint;
var getTextInOncoprintLegend = require('../../../shared/specUtils').getTextInOncoprintLegend;
var assert = require('assert');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");
const ONCOPRINT_TIMEOUT = 60000;

describe("other mutation", ()=>{
    it("should have Other mutations in oncoprint", ()=>{
        browser.url(CBIOPORTAL_URL+'/results?Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=prad_fhcrc_cnaseq&gene_list=YEATS2&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=prad_fhcrc_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=prad_fhcrc_cna&cancer_study_list=prad_fhcrc');
        waitForOncoprint(ONCOPRINT_TIMEOUT);

        const legendText = getTextInOncoprintLegend();
        assert(legendText.indexOf("Other Mutation") > -1);
    });
});
var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils').goToUrlAndSetLocalStorage;
var postDataToUrl = require('../../../shared/specUtils').postDataToUrl;
var parse = require('url-parse');
var _ = require('lodash');

var useExternalFrontend = require('../../../shared/specUtils').useExternalFrontend;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, "");

describe('study select page', function() {

    if (useExternalFrontend) {

        describe('error messaging for invalid study id(s)', function(){

            it('show error alert and query form for single invalid study id',function(){
                var url = `${CBIOPORTAL_URL}/results?localdist=true`;

                const query = {"gene_list":"KRAS NRAS BRAF"
                    ,"cancer_study_list":"coadread_tcga_pub",
                    "case_ids":"","case_set_id":"coadread_tcga_pub_nonhypermut",
                    "Z_SCORE_THRESHOLD":"2.0",
                    "genetic_profile_ids_PROFILE_MUTATION_EXTENDED":"coadread_tcga_pub_mutations",
                    "genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION":"coadread_tcga_pub_gistic"
                };

                postDataToUrl(url, query);

                browser.waitUntil(()=>{
                    var url = browser.getUrl();

                    // make sure param in query is passed to url
                    return _.every(query,(item,key)=>{
                        return url.includes(key);
                    });
                });

                const postData = browser.execute(()=>{
                    return window.postData;
                }).value;

                assert(postData === null, "postData has been set to null after read");

            });
        });

    }
});

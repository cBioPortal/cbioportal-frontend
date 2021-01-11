var assert = require('assert');
var goToUrlAndSetLocalStorage = require('../../../shared/specUtils')
    .goToUrlAndSetLocalStorage;
var postDataToUrl = require('../../../shared/specUtils').postDataToUrl;
var parse = require('url-parse');
var _ = require('lodash');

var {
    useExternalFrontend,
    waitForOncoprint,
} = require('../../../shared/specUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('posting query parameters (instead of GET) to query page', function() {
    if (useExternalFrontend) {
        it('reads posted data (written by backend) and successfully passes params into URL, resulting in oncoprint display', function() {
            var url = `${CBIOPORTAL_URL}/results?localdist=true`;

            let query = {
                gene_list: 'CDKN2A MDM2 MDM4 TP53',
                cancer_study_list: 'study_es_0',
                case_set_id: 'study_es_0_cnaseq',
                profileFilter: '0',
                RPPA_SCORE_THRESHOLD: '2.0',
                Z_SCORE_THRESHOLD: '2.0',
                genetic_profile_ids_PROFILE_MUTATION_EXTENDED:
                    'study_es_0_mutations',
                genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION:
                    'study_es_0_gistic',
            };

            postDataToUrl(url, query);

            // the following could only occur if code passes data written above into url
            browser.waitUntil(() => {
                var url = browser.getUrl();

                // make sure param in query is passed to url and encoded
                return _.every(query, (item, key) => {
                    if (key === 'gene_list') {
                        return url.includes(
                            `${key}=${encodeURIComponent(
                                encodeURIComponent(item)
                            )}`
                        );
                    } else {
                        return url.includes(
                            `${key}=${encodeURIComponent(item)}`
                        );
                    }
                });
            });

            const postData = browser.execute(() => {
                return window.postData;
            }).value;

            assert(
                postData === null,
                'postData has been set to null after read'
            );

            waitForOncoprint();
        });
    }
});

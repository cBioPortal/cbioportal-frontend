Test study _study_es_0_ is a copy of the study with the same name in the cBioPortal backend
repository (https://github.com/cBioPortal/cbioportal/tree/master/core/src/test/scripts/test_data/study_es_0). This study
was copied to the frontend repository in order to provide more stability to the e2e localdb tests (prevent changes to
the backend repo to cause failures in e2e tests). When new additions to _study_es_0_ are needed in e2e-localdb tests,
these changes should be manually copied to the frontend repository version.

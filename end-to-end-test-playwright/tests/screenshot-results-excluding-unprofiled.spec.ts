import {
    HIDE_UNPROFILED_URL,
    hideUnprofiledPreLoad,
    runResultsTestSuite,
} from './helpers/results-screenshots';

runResultsTestSuite('excluding-unprofiled', HIDE_UNPROFILED_URL, {
    // The top gene depends on live cbioportal.org data with patient_enrichments=true
    // (set by the preceding alterations-patient-mode test). AQP7 is the
    // current top hit; if it shifts, swap for whatever the table now ranks first.
    mrnaEnrichmentsRowSelector: 'b:text-is("AQP7")',
    preLoad: hideUnprofiledPreLoad,
});

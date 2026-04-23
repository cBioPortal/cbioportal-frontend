import { test } from '@playwright/test';
import {
    HIDE_UNPROFILED_URL,
    hideUnprofiledPreLoad,
    runResultsTabTests,
} from './helpers/results-screenshots';

// Tab tests are each fresh-page and independent — run them in parallel.
test.describe.configure({ mode: 'parallel' });

runResultsTabTests('excluding-unprofiled', HIDE_UNPROFILED_URL, {
    preLoad: hideUnprofiledPreLoad,
});

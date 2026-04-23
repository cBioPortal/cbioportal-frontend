import { test } from '@playwright/test';
import {
    NO_SESSION_URL,
    runResultsTabTests,
} from './helpers/results-screenshots';

test.describe.configure({ mode: 'parallel' });

runResultsTabTests('no-session', NO_SESSION_URL);

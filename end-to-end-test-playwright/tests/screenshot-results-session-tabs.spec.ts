import { test } from '@playwright/test';
import { SESSION_URL, runResultsTabTests } from './helpers/results-screenshots';

test.describe.configure({ mode: 'parallel' });

runResultsTabTests('session', SESSION_URL);

// Source: end-to-end-test/local/specs/core/version.spec.js
import { test } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

test.describe('Backend version', () => {
    test('Retrieves backend info', async ({ page }) => {
        await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
        const d = await page.evaluate(async () => {
            const res = await fetch('/api/info');
            const json = await res.json();
            return JSON.stringify(json);
        });
        console.log(d);
    });
});

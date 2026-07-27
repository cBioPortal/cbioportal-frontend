import { test, expect } from '../../fixtures';
import { localStackUsesSaml } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:3001'
).replace(/\/$/, '');

test('redirects unauthenticated development sessions to the login page', async ({
    page,
}) => {
    await page.goto(`${CBIOPORTAL_URL}/`, {
        waitUntil: 'domcontentloaded',
    });

    if (await localStackUsesSaml(page, CBIOPORTAL_URL)) {
        await expect(page).toHaveURL(/\/login\?spring-security-redirect=/);
    } else {
        await expect(page).toHaveURL(`${CBIOPORTAL_URL}/`);
    }
});

import { test, expect } from '../../fixtures';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:3001'
).replace(/\/$/, '');

test('redirects unauthenticated development sessions to the login page', async ({
    page,
}) => {
    await page.goto(`${CBIOPORTAL_URL}/`, {
        waitUntil: 'domcontentloaded',
    });

    await expect(page).toHaveURL(/\/login\?spring-security-redirect=/);
});

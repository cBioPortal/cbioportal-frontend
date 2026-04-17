import { test } from '@playwright/test';
import { waitForOncoprint } from './helpers/oncoprint';

/**
 * Port of end-to-end-test/remote/specs/core/redirect.spec.js.
 *
 * /encodedRedirect accepts a base64-encoded target URL and redirects to
 * it — used to work around URL-length limits in email/chat sharing.
 * The assertion is simply that the redirected oncoprint results page
 * loads successfully.
 */

const ENCODED_ONCOPRINT_URL =
    '/encodedRedirect?encodedURL=aHR0cHM6Ly93d3cuY2Jpb3BvcnRhbC5vcmcvcmVzdWx0cy9vbmNvcHJpbnQ/Wl9TQ09SRV9USFJFU0hPTEQ9Mi4wJmNhbmNlcl9zdHVkeV9pZD1jb2FkcmVhZF90Y2dhX3B1YiZjYW5jZXJfc3R1ZHlfbGlzdD1jb2FkcmVhZF90Y2dhX3B1YiZjYXNlX3NldF9pZD1jb2FkcmVhZF90Y2dhX3B1Yl9ub25oeXBlcm11dCZnZW5lX2xpc3Q9S1JBUyUyME5SQVMlMjBCUkFGJmdlbmVfc2V0X2Nob2ljZT11c2VyLWRlZmluZWQtbGlzdCZnZW5ldGljX3Byb2ZpbGVfaWRzX1BST0ZJTEVfQ09QWV9OVU1CRVJfQUxURVJBVElPTj1jb2FkcmVhZF90Y2dhX3B1Yl9naXN0aWMmZ2VuZXRpY19wcm9maWxlX2lkc19QUk9GSUxFX01VVEFUSU9OX0VYVEVOREVEPWNvYWRyZWFkX3RjZ2FfcHViX211dGF0aW9ucw%3D%3D';

test.describe('/encodedRedirect', () => {
    test('correctly redirects to a results view page URL', async ({ page }) => {
        await page.goto(ENCODED_ONCOPRINT_URL);
        await waitForOncoprint(page);
    });
});

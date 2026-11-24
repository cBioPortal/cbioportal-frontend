import { APIRequestContext } from '@playwright/test';
import { test, expect } from '../../../fixtures';
import {
    ALLOWED_STUDY,
    BASIC_USER,
    CBIOPORTAL_URL,
    onlyInAuthModes,
    OTHER_STUDY,
    PASSWORD,
    studyIds,
} from './auth-helpers';

// Basic login has no page in the frontend; clients post the form directly.
function basicLogin(
    request: APIRequestContext,
    username: string,
    password: string
) {
    return request.post(`${CBIOPORTAL_URL}/j_spring_security_check`, {
        form: { j_username: username, j_password: password },
        maxRedirects: 0,
    });
}

test.describe('basic login', () => {
    onlyInAuthModes('saml_plus_basic');

    test('gives the basic user access to its permitted studies', async ({
        request,
    }) => {
        expect((await basicLogin(request, BASIC_USER, PASSWORD)).status()).toBe(
            302
        );
        expect(
            await studyIds(await request.get(`${CBIOPORTAL_URL}/api/studies`))
        ).toEqual([ALLOWED_STUDY]);
        expect(
            (
                await request.get(
                    `${CBIOPORTAL_URL}/api/studies/${OTHER_STUDY}`
                )
            ).status()
        ).toBe(403);
    });

    test('rejects a wrong password', async ({ request }) => {
        expect(
            (await basicLogin(request, BASIC_USER, 'wrong-password')).status()
        ).toBe(401);
        expect(
            (await request.get(`${CBIOPORTAL_URL}/api/studies`)).status()
        ).toBe(401);
    });

    test('rejects an unknown user', async ({ request }) => {
        expect(
            (await basicLogin(request, 'nosuchuser', PASSWORD)).status()
        ).toBe(401);
    });

    test('logout ends the session', async ({ request }) => {
        await basicLogin(request, BASIC_USER, PASSWORD);
        await request.get(`${CBIOPORTAL_URL}/j_spring_security_logout`);
        expect(
            (await request.get(`${CBIOPORTAL_URL}/api/studies`)).status()
        ).toBe(401);
    });
});

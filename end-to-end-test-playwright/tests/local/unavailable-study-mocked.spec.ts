import { test, expect, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

// Frontend handling of unavailable studies, independent of which studies the
// localdb database marks unavailable: the backend responses are rewritten
// with page.route so an otherwise available study looks mid-(re)import.
// unavailable-study.spec.ts covers the same behavior against the real
// backend.
const STUDY_ID = 'study_es_0';

/**
 * Logs in first, so the Keycloak/SAML round-trip isn't affected by the
 * mocked routes installed afterwards.
 */
async function login(page: Page) {
    await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);
}

/** Answers every API request that names STUDY_ID with 423 Locked. */
async function lockStudy(page: Page, body?: { message: string }) {
    await page.route(
        url => url.pathname.startsWith('/api/'),
        async route => {
            const request = route.request();
            const namesStudy = `${request.url()} ${request.postData() ??
                ''}`.includes(STUDY_ID);
            if (!namesStudy) {
                return route.fallback();
            }
            return route.fulfill(
                body ? { status: 423, json: body } : { status: 423, body: '' }
            );
        }
    );
}

test.describe('unavailable study, mocked backend', () => {
    test('greys out a study whose status is not 1, even when readable', async ({
        page,
    }) => {
        await login(page);

        // Mark the study unavailable but leave readPermission untouched, so
        // what's asserted below comes from the status alone.
        await page.route(
            url => url.pathname === '/api/studies',
            async route => {
                const response = await route.fetch();
                const studies = await response.json();
                for (const study of studies) {
                    if (study.studyId === STUDY_ID) {
                        study.status = 0;
                    }
                }
                await route.fulfill({ response, json: studies });
            }
        );

        const resourceDefinitionsRequest = page.waitForRequest(
            req =>
                new URL(req.url()).pathname ===
                '/api/resource-definitions/fetch'
        );
        await page.goto(CBIOPORTAL_URL);

        const requestedStudyIds = (
            await resourceDefinitionsRequest
        ).postDataJSON();
        expect(requestedStudyIds).not.toContain(STUDY_ID);
        expect(requestedStudyIds.length).toBeGreaterThan(0);

        await page
            .locator('[data-test=cancerTypeListContainer]')
            .waitFor({ state: 'attached' });

        const row = page
            .locator('[data-test=StudySelect]')
            .filter({ has: page.locator(`.studyItem_${STUDY_ID}`) });
        const name = row.locator(`.studyItem_${STUDY_ID}`);
        await expect(name).toHaveClass(/UnavailableStudy/);
        await expect(name.locator('.fa-refresh')).toBeVisible();
        await expect(row.locator('.ci-pie-chart')).toHaveCount(0);

        await name.hover();
        await expect(
            page.getByText(
                'This study is currently being updated and is temporarily unavailable.'
            )
        ).toBeVisible();
    });

    test('shows the backend message on the Study Unavailable page', async ({
        page,
    }) => {
        const message = `Study ${STUDY_ID} is being updated. Please check back later.`;
        await login(page);
        await lockStudy(page, { message });

        await page.goto(`${CBIOPORTAL_URL}/study/summary?id=${STUDY_ID}`);

        await expect(
            page.locator('h4', { hasText: 'Study Unavailable' })
        ).toBeVisible({ timeout: 30000 });
        await expect(page.locator('.alert-danger')).toContainText(message);
    });

    test('falls back to a generic message when the 423 has no body', async ({
        page,
    }) => {
        await login(page);
        await lockStudy(page);

        await page.goto(`${CBIOPORTAL_URL}/study/summary?id=${STUDY_ID}`);

        await expect(
            page.locator('h4', { hasText: 'Study Unavailable' })
        ).toBeVisible({ timeout: 30000 });
        await expect(page.locator('.alert-danger')).toContainText(
            'This study is being updated. Please check back later.'
        );
    });
});

import { test, expect, Page } from '../../fixtures';
import { goToUrlAndSetLocalStorage } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

// study_hg38 has cancer_study.status = 0 in the localdb database, i.e. it is
// mid-(re)import. The localdb portal.properties sets
// study_availability.enabled=true, so the backend answers 423 Locked for any
// request that names the study, one of its molecular profiles or one of its
// sample lists, while still listing it in /api/studies.
const UNAVAILABLE_STUDY_ID = 'study_hg38';
const UNAVAILABLE_STUDY_NAME = 'Study HG38';
const UNAVAILABLE_PROFILE_ID = 'study_hg38_mutations';
const UNAVAILABLE_SAMPLE_LIST_ID = 'study_hg38_all';
const UNAVAILABLE_PATIENT_ID = 'TCGA-A2-A04P';
const UNAVAILABLE_MESSAGE = `Study ${UNAVAILABLE_STUDY_ID} is being updated. Please check back later.`;

const AVAILABLE_STUDY_ID = 'study_es_0';

type ApiResult = { status: number; json: any };

/**
 * Calls the portal API from inside the page, so the request carries the
 * Keycloak session cookie of the logged-in test user.
 */
async function callApi(
    page: Page,
    path: string,
    body?: unknown
): Promise<ApiResult> {
    return page.evaluate(
        async ({ path, body }) => {
            const res = await fetch(
                path,
                body === undefined
                    ? undefined
                    : {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(body),
                      }
            );
            const text = await res.text();
            let json: any;
            try {
                json = JSON.parse(text);
            } catch (e) {
                json = undefined;
            }
            return { status: res.status, json };
        },
        { path, body }
    );
}

function expectLocked(result: ApiResult) {
    expect(result.status).toBe(423);
    expect(result.json?.message).toBe(UNAVAILABLE_MESSAGE);
}

async function expectStudyUnavailableScreen(page: Page) {
    await expect(
        page.locator('h4', { hasText: 'Study Unavailable' })
    ).toBeVisible({ timeout: 30000 });
    await expect(page.locator('.alert-danger')).toContainText(
        UNAVAILABLE_MESSAGE
    );
}

test.describe('unavailable study (HTTP 423)', () => {
    test.describe('API', () => {
        test.describe.configure({ mode: 'serial' });

        let sharedPage: Page;

        test.beforeAll(async ({ browser }) => {
            sharedPage = await browser.newPage();
            await goToUrlAndSetLocalStorage(sharedPage, CBIOPORTAL_URL, true);
        });

        test.afterAll(async () => {
            await sharedPage.close();
        });

        test('lists the unavailable study with status 0 and no read permission', async () => {
            const result = await callApi(
                sharedPage,
                '/api/studies?projection=SUMMARY'
            );
            expect(result.status).toBe(200);

            const unavailable = result.json.find(
                (s: any) => s.studyId === UNAVAILABLE_STUDY_ID
            );
            expect(unavailable).toBeDefined();
            expect(unavailable.status).toBe(0);
            expect(unavailable.readPermission).toBe(false);

            const available = result.json.find(
                (s: any) => s.studyId === AVAILABLE_STUDY_ID
            );
            expect(available.status).toBe(1);
            expect(available.readPermission).toBe(true);
        });

        test('returns 423 for the study itself', async () => {
            expectLocked(
                await callApi(
                    sharedPage,
                    `/api/studies/${UNAVAILABLE_STUDY_ID}`
                )
            );
        });

        test('still serves available studies', async () => {
            const result = await callApi(
                sharedPage,
                `/api/studies/${AVAILABLE_STUDY_ID}`
            );
            expect(result.status).toBe(200);
            expect(result.json.studyId).toBe(AVAILABLE_STUDY_ID);
        });

        test('returns 423 naming the owning study for its molecular profile', async () => {
            expectLocked(
                await callApi(
                    sharedPage,
                    `/api/molecular-profiles/${UNAVAILABLE_PROFILE_ID}`
                )
            );
        });

        test('returns 423 naming the owning study for its sample list', async () => {
            expectLocked(
                await callApi(
                    sharedPage,
                    `/api/sample-lists/${UNAVAILABLE_SAMPLE_LIST_ID}`
                )
            );
        });

        test('returns 423 when a POST filter names its molecular profile', async () => {
            expectLocked(
                await callApi(sharedPage, '/api/mutations/fetch', {
                    molecularProfileIds: [UNAVAILABLE_PROFILE_ID],
                    entrezGeneIds: [7157],
                })
            );
        });

        test('rejects a whole batch request that names the unavailable study', async () => {
            // Why the homepage leaves unavailable studies out of its
            // resource-definitions request.
            expectLocked(
                await callApi(sharedPage, '/api/resource-definitions/fetch', [
                    AVAILABLE_STUDY_ID,
                    UNAVAILABLE_STUDY_ID,
                ])
            );
        });
    });

    test.describe('homepage', () => {
        test('renders the study selector with the unavailable study greyed out', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorage(page, CBIOPORTAL_URL, true);

            const resourceDefinitionsResponse = page.waitForResponse(
                res =>
                    new URL(res.url()).pathname ===
                    '/api/resource-definitions/fetch'
            );
            await page.goto(CBIOPORTAL_URL);

            // The resource-definitions request must leave the unavailable
            // study out; if it named it, the request would 423 and the
            // study selector, which waits on it, would never render.
            const response = await resourceDefinitionsResponse;
            expect(response.status()).toBe(200);
            const requestedStudyIds = response.request().postDataJSON();
            expect(requestedStudyIds).toContain(AVAILABLE_STUDY_ID);
            expect(requestedStudyIds).not.toContain(UNAVAILABLE_STUDY_ID);

            await page
                .locator('[data-test=cancerTypeListContainer]')
                .waitFor({ state: 'attached' });

            const unavailableRow = page
                .locator('[data-test=StudySelect]')
                .filter({
                    has: page.locator(`.studyItem_${UNAVAILABLE_STUDY_ID}`),
                });
            const unavailableName = unavailableRow.locator(
                `.studyItem_${UNAVAILABLE_STUDY_ID}`
            );
            await expect(unavailableName).toBeVisible();
            await expect(unavailableName).toContainText(UNAVAILABLE_STUDY_NAME);
            await expect(unavailableName).toHaveClass(/UnavailableStudy/);
            await expect(unavailableName).toHaveCSS('font-style', 'italic');
            await expect(unavailableName.locator('.fa-refresh')).toBeVisible();

            // No read permission: can't be selected, no study view shortcut
            await expect(
                unavailableRow.locator('input[type=checkbox]')
            ).toBeDisabled();
            await expect(unavailableRow.locator('.ci-pie-chart')).toHaveCount(
                0
            );

            // Available studies are unaffected
            const availableRow = page
                .locator('[data-test=StudySelect]')
                .filter({
                    has: page.locator(`.studyItem_${AVAILABLE_STUDY_ID}`),
                });
            await expect(
                availableRow.locator(`.studyItem_${AVAILABLE_STUDY_ID}`)
            ).not.toHaveClass(/UnavailableStudy/);
            await expect(availableRow.locator('.ci-pie-chart')).toHaveCount(1);

            await unavailableName.hover();
            await expect(
                page.getByText(
                    'This study is currently being updated and is temporarily unavailable.'
                )
            ).toBeVisible();
        });
    });

    test.describe('pages of the unavailable study', () => {
        test('study view shows the Study Unavailable page', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorage(
                page,
                `${CBIOPORTAL_URL}/study/summary?id=${UNAVAILABLE_STUDY_ID}`,
                true
            );
            await expectStudyUnavailableScreen(page);
        });

        test('results view shows the Study Unavailable page', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorage(
                page,
                `${CBIOPORTAL_URL}/results/oncoprint?cancer_study_list=${UNAVAILABLE_STUDY_ID}&case_set_id=${UNAVAILABLE_SAMPLE_LIST_ID}&profileFilter=mutations&gene_list=TP53`,
                true
            );
            await expectStudyUnavailableScreen(page);
        });

        test('patient view shows the Study Unavailable page', async ({
            page,
        }) => {
            await goToUrlAndSetLocalStorage(
                page,
                `${CBIOPORTAL_URL}/patient?studyId=${UNAVAILABLE_STUDY_ID}&caseId=${UNAVAILABLE_PATIENT_ID}`,
                true
            );
            await expectStudyUnavailableScreen(page);
        });
    });
});

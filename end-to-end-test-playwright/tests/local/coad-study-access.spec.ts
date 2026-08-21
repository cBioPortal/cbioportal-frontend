import { test, expect } from '../../fixtures';
import { ensureLocalLogin } from './helpers';

const CBIOPORTAL_URL = (
    process.env.CBIOPORTAL_URL ?? 'http://localhost:3001'
).replace(/\/$/, '');
const EXPECTED_STUDY_ID = process.env.CBIOPORTAL_E2E_STUDY_ID ?? 'study_es_0';

test('loads the configured study for an authenticated local user', async ({
    page,
}) => {
    await ensureLocalLogin(page, CBIOPORTAL_URL);

    const response = await page.request.get(
        `${CBIOPORTAL_URL}/api/studies?projection=DETAILED`
    );
    expect(response.status()).toBe(200);
    const studies = await response.json();
    expect(studies).toEqual(
        expect.arrayContaining([
            expect.objectContaining({ studyId: EXPECTED_STUDY_ID }),
        ])
    );
});

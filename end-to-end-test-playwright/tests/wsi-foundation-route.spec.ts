import { test, expect } from '../fixtures';
import { keycloakLogin } from './local/helpers';

const baseUrl = process.env.WSI_VIEWER_BASE_URL ?? '';
const studyId = process.env.WSI_LIVE_STUDY_ID ?? 'msk_spectrum_tme_2022';
const patientId = process.env.WSI_LIVE_PATIENT_ID ?? 'P-0055908';

test.describe('WSI foundation patient entrypoint', () => {
    test('loads the standalone hierarchy viewer without molecular enrichment', async ({
        page,
    }) => {
        test.skip(
            !baseUrl,
            'WSI_VIEWER_BASE_URL is required for foundation E2E'
        );

        const enrichmentRequests: string[] = [];
        const consoleErrors: string[] = [];
        page.on('request', request => {
            if (/annotate|oncokb/i.test(request.url())) {
                enrichmentRequests.push(request.url());
            }
        });
        page.on('console', message => {
            if (message.type() === 'error') consoleErrors.push(message.text());
        });

        await page.goto(
            `${baseUrl}/wsi/patient/${encodeURIComponent(
                patientId
            )}?studyId=${encodeURIComponent(studyId)}`
        );
        if (process.env.WSI_AUTHENTICATED_E2E === 'true') {
            const authPortal =
                process.env.WSI_AUTH_PORTAL_URL ?? 'http://localhost:8080';
            await page.goto(`${authPortal}/`);
            await keycloakLogin(page);
            await page.goto(
                `${baseUrl}/wsi/patient/${encodeURIComponent(
                    patientId
                )}?studyId=${encodeURIComponent(studyId)}`
            );
        }

        await expect(page.getByTestId('wsi-route-unavailable')).toHaveCount(0);
        await expect(page.getByTitle('Zoom in')).toBeVisible({
            timeout: 60_000,
        });
        await expect(page.getByTitle('Fit to view')).toBeVisible();
        expect(enrichmentRequests).toEqual([]);
        expect(consoleErrors).toEqual([]);
    });
});

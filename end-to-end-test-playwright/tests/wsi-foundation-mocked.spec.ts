import { test, expect } from '../fixtures';
import {
    installFoundationMocks,
    STUDY_ID,
    PATIENT_ID,
    IMAGE_ID,
} from './wsi-foundation-mocks';

if (process.env.PW_SUITE === 'wsi' && process.env.WSI_CHILD_CONTRACT !== '1') {
    test.describe('WSI foundation browser contract', () => {
        test('loads a deep-linked slide and serves the viewer without enrichment', async ({
            page,
        }) => {
            const enrichmentRequests = await installFoundationMocks(page);
            const pageErrors: string[] = [];
            page.on('pageerror', error => pageErrors.push(error.message));

            await page.goto(
                `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}#wsi:slide=${IMAGE_ID}&x=256&y=256&z=0.75`
            );

            await expect(page.getByTestId('wsi-route-unavailable')).toHaveCount(
                0
            );
            await expect(
                page.getByTestId('wsi-filtered-slide-count')
            ).toHaveText('Showing 1 slide', { timeout: 30000 });
            await expect(
                page.getByTestId(`wsi-slide-item-${IMAGE_ID}`)
            ).toBeVisible();
            await expect(page.getByTitle('Zoom in')).toBeVisible({
                timeout: 30000,
            });
            await expect(page.getByTitle('Fit to view')).toBeVisible();
            expect(new URL(page.url()).hash).toContain(`slide=${IMAGE_ID}`);
            expect(enrichmentRequests).toEqual([]);
            expect(pageErrors).toEqual([]);
        });
    });
}

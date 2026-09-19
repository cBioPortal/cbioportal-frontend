import { test, expect } from '../fixtures';

const baseUrl = process.env.WSI_VIEWER_BASE_URL ?? '';

test.describe('WSI pathology timing contract', () => {
    test('serves recorded and undated timing without a synthetic day-zero date', async ({
        request,
    }) => {
        test.skip(!baseUrl, 'WSI_VIEWER_BASE_URL not set');

        const undatedResponse = await request.get(
            `${baseUrl}/api/wsi/v2/hierarchy/mskimpact/P-0003647`
        );
        expect(undatedResponse.ok()).toBe(true);
        const undated = await undatedResponse.json();
        const undatedSlides = undated.sampleGroups
            .flatMap((group: any) => group.parts)
            .flatMap((part: any) => part.blocks)
            .flatMap((block: any) => block.slides);
        expect(undatedSlides.length).toBe(260);
        expect(
            undatedSlides.every(
                (slide: any) =>
                    slide.procedureDateDays === null &&
                    slide.procedureDateKind === 'UNDATED' &&
                    slide.procedureDateReason === 'MISSING_PROCEDURE_DATE'
            )
        ).toBe(true);

        const recordedResponse = await request.get(
            `${baseUrl}/api/wsi/v2/hierarchy/mskimpact/P-0000012`
        );
        expect(recordedResponse.ok()).toBe(true);
        const recorded = await recordedResponse.json();
        const recordedSlide = recorded.sampleGroups
            .flatMap((group: any) => group.parts)
            .flatMap((part: any) => part.blocks)
            .flatMap((block: any) => block.slides)
            .find((slide: any) => slide.imageId === '322525');
        expect(recordedSlide).toMatchObject({
            procedureDateDays: -53,
            procedureDateKind: 'RECORDED',
            procedureDateStatus: 'AVAILABLE',
            procedureDateSource: 'DATE_OF_PROCEDURE_SURGICAL',
        });
    });
});

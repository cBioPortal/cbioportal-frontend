import { test, expect } from '../fixtures';

const STUDY_ID = 'msk_spectrum_tme_2022';
const PATIENT_ID = 'P-0055908';
const SAMPLE_ID = 'P-0055908-T01-IM6';

const hierarchy = {
    referenceSampleId: SAMPLE_ID,
    sampleGroups: [
        {
            sampleId: SAMPLE_ID,
            parts: [
                {
                    partNumber: '1',
                    partDesignator: '1',
                    partType: '',
                    partDescription: 'Right adnexa',
                    subspecialty: '',
                    pathDxTitle: '',
                    blocks: [
                        {
                            blockNumber: '1',
                            blockLabel: 'A1',
                            slides: [
                                {
                                    imageId: 'mock-hne-1',
                                    stainName: 'H&E initial',
                                    stainGroup: 'H&E (Initial)',
                                    isHne: true,
                                    isIhc: false,
                                    magnification: '',
                                    fileSizeBytes: null,
                                    canServeTiles: true,
                                    barcode: '',
                                    slideType: 'H&E',
                                    sampleId: SAMPLE_ID,
                                    matchLevel: 'BLOCK',
                                    specimenKey: 'block::1::1',
                                    procedureDateDays: -10,
                                    timepointSource: 'Procedure date',
                                },
                                {
                                    imageId: 'mock-hne-2',
                                    stainName: 'H&E initial',
                                    stainGroup: 'H&E (Initial)',
                                    isHne: true,
                                    isIhc: false,
                                    magnification: '',
                                    fileSizeBytes: null,
                                    canServeTiles: true,
                                    barcode: '',
                                    slideType: 'H&E',
                                    sampleId: SAMPLE_ID,
                                    matchLevel: 'BLOCK',
                                    specimenKey: 'block::1::1',
                                    procedureDateDays: -10,
                                    timepointSource: 'Procedure date',
                                },
                                {
                                    imageId: 'mock-ihc-1',
                                    stainName: 'IHC recut',
                                    stainGroup: 'IHC',
                                    isHne: false,
                                    isIhc: true,
                                    magnification: '',
                                    fileSizeBytes: null,
                                    canServeTiles: true,
                                    barcode: '',
                                    slideType: 'IHC',
                                    sampleId: SAMPLE_ID,
                                    matchLevel: 'BLOCK',
                                    specimenKey: 'block::1::1',
                                    procedureDateDays: -10,
                                    timepointSource: 'Procedure date',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            sampleId: null,
            parts: [
                {
                    partNumber: '1',
                    partDesignator: '1',
                    partType: '',
                    partDescription: 'Right adnexa',
                    subspecialty: '',
                    pathDxTitle: '',
                    blocks: [
                        {
                            blockNumber: '1',
                            blockLabel: 'A1',
                            slides: [
                                {
                                    imageId: 'mock-unmatched-1',
                                    stainName: 'H&E unlinked',
                                    stainGroup: 'H&E (Initial)',
                                    isHne: true,
                                    isIhc: false,
                                    magnification: '',
                                    fileSizeBytes: null,
                                    canServeTiles: false,
                                    barcode: '',
                                    slideType: 'H&E',
                                    sampleId: null,
                                    matchLevel: 'UNMATCHED',
                                    specimenKey: 'unmatched::1',
                                    procedureDateDays: -10,
                                    timepointSource: 'Procedure date',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

const metadata = {
    dimensions: { width: 512, height: 512 },
    levels: 1,
    level_dimensions: [{ width: 512, height: 512 }],
    max_zoom: 0,
    tile_size: 256,
};

const baseClinicalEvents = [
    {
        eventType: 'TREATMENT',
        patientId: PATIENT_ID,
        studyId: STUDY_ID,
        uniquePatientKey: `${STUDY_ID}_${PATIENT_ID}`,
        uniqueSampleKey: `${STUDY_ID}_${PATIENT_ID}-treatment-1`,
        startNumberOfDaysSinceDiagnosis: 0,
        endNumberOfDaysSinceDiagnosis: 0,
        attributes: [{ key: 'AGENT', value: 'Mock treatment' }],
    },
];

const backendPathologyClinicalEvents = [
    ...baseClinicalEvents,
    {
        eventType: 'PATHOLOGY SLIDES',
        patientId: PATIENT_ID,
        studyId: STUDY_ID,
        uniquePatientKey: `${STUDY_ID}_${PATIENT_ID}`,
        uniqueSampleKey: `${STUDY_ID}_${SAMPLE_ID}_pathology`,
        startNumberOfDaysSinceDiagnosis: -10,
        endNumberOfDaysSinceDiagnosis: -10,
        attributes: [
            { key: 'SAMPLE_ID', value: SAMPLE_ID },
            { key: 'SUBTYPE', value: 'H&E' },
            { key: 'MATCH_LEVEL', value: 'BLOCK' },
            { key: 'SPECIMEN', value: 'Backend-only specimen' },
            { key: 'IMAGE_COUNT', value: '1' },
            { key: 'NON_SERVABLE_IMAGE_COUNT', value: '0' },
            { key: 'TOTAL_IMAGE_COUNT', value: '1' },
        ],
    },
];

const baseSamples = [
    {
        sampleId: SAMPLE_ID,
        sampleType: 'Primary Solid Tumor',
        patientId: PATIENT_ID,
        studyId: STUDY_ID,
        sequenced: true,
        copyNumberSegmentPresent: true,
        uniqueSampleKey: `${STUDY_ID}_${SAMPLE_ID}`,
        uniquePatientKey: `${STUDY_ID}_${PATIENT_ID}`,
    },
];

const baseStudy = {
    studyId: STUDY_ID,
    cancerTypeId: 'ovary',
    name: 'Mock SPECTRUM Study',
    publicStudy: true,
    groups: 'PUBLIC',
    status: 0,
    referenceGenome: 'hg19',
    cancerType: {
        id: 'ovary',
        name: 'Ovarian Cancer',
        shortName: 'OVARY',
    },
};

function configureMockedWsi(page: import('@playwright/test').Page) {
    return page.addInitScript(
        ({ tileServerUrl }) => {
            localStorage.setItem(
                'frontendConfig',
                JSON.stringify({
                    serverConfig: {
                        msk_wsi_tile_server_url: tileServerUrl,
                        msk_wsi_authentication_enabled: false,
                    },
                })
            );
        },
        { tileServerUrl: '/wsi' }
    );
}

async function installRoutes(
    page: import('@playwright/test').Page,
    clinicalEvents = baseClinicalEvents
) {
    await page.route(
        `**/api/studies/${STUDY_ID}/patients/${PATIENT_ID}/clinical-events**`,
        async route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(clinicalEvents),
            })
    );

    await page.route(
        `**/api/studies/${STUDY_ID}/patients/${PATIENT_ID}/samples**`,
        async route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(baseSamples),
            })
    );

    // Sample-only WSI linkouts resolve the patient from the sample before
    // releasing the linkout scope when a facet changes.
    await page.route(
        `**/api/studies/${STUDY_ID}/samples/${SAMPLE_ID}`,
        async route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(baseSamples[0]),
            })
    );

    await page.route(`**/api/studies/${STUDY_ID}`, async route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(baseStudy),
        })
    );

    await page.route(
        `**/api/studies/${STUDY_ID}/patients/${PATIENT_ID}/clinical-data**`,
        async route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            })
    );

    await page.route(
        `**/api/wsi/v2/hierarchy/${STUDY_ID}/${PATIENT_ID}`,
        async route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(hierarchy),
            })
    );

    await page.route(
        `**/api/wsi/v2/slides/${STUDY_ID}/*/access`,
        async route => {
            const imageId = decodeURIComponent(
                new URL(route.request().url()).pathname.split('/').at(-2) ?? ''
            );
            const sourceUrl = `s3://mock-bucket/${imageId}.svs`;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    imageId,
                    sourceUrl,
                    accessToken: 'mock-wsi-token',
                    expiresIn: 300,
                    tileMetadata: metadata,
                    thumbnail: {
                        sourceUrl: `s3://mock-bucket/${imageId}.thumb.jpg`,
                        width: 128,
                        height: 96,
                    },
                }),
            });
        }
    );

    await page.route('**/wsi/tiles/*/metadata**', async route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(metadata),
        })
    );

    await page.route('**/wsi/thumbnails**', async route =>
        route.fulfill({
            status: 200,
            contentType: 'image/png',
            headers: {
                'X-Thumbnail-Status': 'ok',
                'X-Thumbnail-Reason': 'master',
            },
            body: Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
                'base64'
            ),
        })
    );

    await page.route('**/wsi/tiles/zxy/**', async route =>
        route.fulfill({
            status: 200,
            contentType: 'image/png',
            body: Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
                'base64'
            ),
        })
    );
}

function patientUrl(path: string) {
    return `/${path}?studyId=${STUDY_ID}&caseId=${PATIENT_ID}`;
}

test.describe('native WSI pathology contract with mocked services', () => {
    test('summary and Clinical Data refresh stale backend WSI counts from the hierarchy', async ({
        page,
    }) => {
        await configureMockedWsi(page);
        await installRoutes(page, backendPathologyClinicalEvents);

        await page.goto(patientUrl('patient/summary'));
        // The labels can render while the timeline store is still waiting for
        // its viewport measurement. Assert the SVG itself so a store refresh
        // cannot leave the summary timeline visually blank.
        await expect(page.locator('.tl-timeline-svg')).toBeVisible({
            timeout: 30000,
        });
        await expect(page.locator('.tl-timeline-tracklabels')).toBeVisible({
            timeout: 30000,
        });
        await expect(page.locator('.tl-timeline-tracklabels')).toContainText(
            'PATHOLOGY'
        );
        await expect(page.locator('.tl-timeline-tracklabels')).toContainText(
            /SLIDES/i
        );

        await page.goto(patientUrl('patient/clinicalData'));
        await expect(page.locator('body')).not.toContainText(
            'Backend-only specimen'
        );
        await expect(
            page.getByText('View 2 of 2', { exact: true })
        ).toBeVisible({
            timeout: 30000,
        });
    });

    test('summary and Clinical Data use the association-backed pathology event', async ({
        page,
    }) => {
        await configureMockedWsi(page);
        await installRoutes(page);
        const requests: string[] = [];
        page.on('request', request => requests.push(request.url()));

        await page.goto(patientUrl('patient/summary'));
        await expect(page.locator('body')).toContainText(/PATHOLOGY/i, {
            timeout: 30000,
        });
        await expect(page.locator('body')).toContainText('H&E');
        await expect(page.locator('body')).toContainText('IHC');

        await page.goto(patientUrl('patient/clinicalData'));
        await expect(page.locator('body')).toContainText(
            /pathology slides.*DATE/i,
            {
                timeout: 30000,
            }
        );
        const pathologyTable = page
            .locator('table')
            .filter({ hasText: 'DATE (DAYS)' });
        await expect(pathologyTable).toHaveCount(1);
        await expect(pathologyTable.locator('tbody tr')).toHaveCount(3);
        const pathologyRows = pathologyTable.locator('tbody tr');
        await expect(pathologyRows).toContainText(['H&E', 'IHC', 'H&E']);
        await expect(
            page.getByText('View 2 of 2', { exact: true })
        ).toHaveCount(1);
        await expect(
            page.getByText('View 1 of 1', { exact: true })
        ).toHaveCount(1);
        await expect(pathologyTable).toContainText('Unmatched');
        await expect(page.locator('body')).not.toContainText(/WSI TIMEPOINT/i);
        await expect(page.locator('body')).not.toContainText(/HAS WSI SLIDE/i);
    });

    test('Clinical Data linkouts are exact and visible All filters release their scope', async ({
        page,
    }) => {
        await configureMockedWsi(page);
        await installRoutes(page, backendPathologyClinicalEvents);

        await page.goto(patientUrl('patient/clinicalData'));
        const clinicalLink = page
            .locator('a')
            .filter({ hasText: 'View 2 of 2' })
            .first();
        await expect(clinicalLink).toBeVisible({ timeout: 30000 });

        await page.evaluate(() => {
            (window as any).__wsiLinkoutSentinel = 'same-document';
        });
        await clinicalLink.click();
        await expect(page).toHaveURL(/\/patient\/wsiHESlides/);
        expect(
            await page.evaluate(() => (window as any).__wsiLinkoutSentinel)
        ).toBe('same-document');

        await expect(
            page.locator('[data-testid="wsi-filtered-slide-count"]')
        ).toHaveText('Showing 2 slides', { timeout: 30000 });
        await expect(
            page.locator('[data-testid^="wsi-slide-item-"]')
        ).toHaveCount(2);
        await expect(
            page.locator('[data-testid="wsi-stain-filter-ihc"]')
        ).toContainText('(1)');

        const scopedLinkoutUrl = new URL(page.url());
        expect(scopedLinkoutUrl.searchParams.get('wsiScope')).toBe('linkout');
        expect(scopedLinkoutUrl.searchParams.get('timepointDays')).toBe('-10');

        await page.locator('[data-testid="wsi-match-filter-all"]').click();
        await expect(
            page.locator('[data-testid="wsi-filtered-slide-count"]')
        ).toHaveText('Showing 2 slides');

        const afterMatchAll = new URL(page.url());
        expect(afterMatchAll.searchParams.get('sampleId')).toBeNull();
        expect(afterMatchAll.searchParams.get('specimenKey')).toBeNull();
        expect(afterMatchAll.searchParams.get('matchLevel')).toBeNull();
        expect(afterMatchAll.searchParams.get('wsiScope')).toBe('patient');

        await page.locator('[data-testid="wsi-stain-filter-all"]').click();
        await expect(
            page.locator('[data-testid="wsi-filtered-slide-count"]')
        ).toHaveText('Showing 3 slides');

        const afterStainAll = new URL(page.url());
        expect(afterStainAll.searchParams.get('sampleId')).toBeNull();
        expect(afterStainAll.searchParams.get('specimenKey')).toBeNull();
        expect(afterStainAll.searchParams.get('stainFilter')).toBeNull();
        expect(afterStainAll.searchParams.get('matchLevel')).toBeNull();
    });

    test('sequential same-specimen stain linkouts keep their exact scope', async ({
        page,
    }) => {
        await configureMockedWsi(page);
        await installRoutes(page);

        await page.goto(patientUrl('patient/clinicalData'));
        await expect(
            page.getByText('View 2 of 2', { exact: true })
        ).toBeVisible({ timeout: 30000 });
        await expect(
            page.getByText('View 1 of 1', { exact: true })
        ).toBeVisible({ timeout: 30000 });

        await page
            .getByText('View 2 of 2', { exact: true })
            .first()
            .click();
        await expect(page).toHaveURL(/\/patient\/wsiHESlides/);
        await expect(
            page.locator('[data-testid="wsi-filtered-slide-count"]')
        ).toHaveText('Showing 2 slides', { timeout: 30000 });
        expect(new URL(page.url()).searchParams.get('stainFilter')).toBe('hne');
        expect(new URL(page.url()).searchParams.get('wsiScope')).toBe(
            'linkout'
        );

        await page.goBack();
        await expect(
            page.getByText('View 1 of 1', { exact: true })
        ).toBeVisible({ timeout: 30000 });
        await page
            .getByText('View 1 of 1', { exact: true })
            .first()
            .click();
        await expect(page).toHaveURL(/\/patient\/wsiHESlides/);
        await expect(
            page.locator('[data-testid="wsi-filtered-slide-count"]')
        ).toHaveText('Showing 1 slide', { timeout: 30000 });
        expect(new URL(page.url()).searchParams.get('stainFilter')).toBe('ihc');
        expect(new URL(page.url()).searchParams.get('wsiScope')).toBe(
            'linkout'
        );
    });

    test('sample-only linkouts remain on the patient route when selecting a match filter', async ({
        page,
    }) => {
        await configureMockedWsi(page);
        await installRoutes(page);

        await page.goto(
            `/patient/wsiHESlides?studyId=${STUDY_ID}&sampleId=${SAMPLE_ID}#wsi:slide=mock-hne-1&x=12&y=24&z=0.7`
        );
        await expect(
            page.locator('[data-testid="wsi-filtered-slide-count"]')
        ).toHaveText('Showing 3 slides', { timeout: 30000 });

        await page.locator('[data-testid="wsi-match-filter-block"]').click();

        await expect(
            page.locator('[data-testid="wsi-filtered-slide-count"]')
        ).toHaveText('Showing 3 slides', { timeout: 30000 });
        expect(new URL(page.url()).searchParams.get('caseId')).toBe(PATIENT_ID);
        expect(new URL(page.url()).searchParams.get('sampleId')).toBeNull();
        expect(new URL(page.url()).searchParams.get('wsiScope')).toBe(
            'patient'
        );
    });

    test('viewer uses only same-origin mocked hierarchy, metadata, and tile requests', async ({
        page,
    }) => {
        await configureMockedWsi(page);
        await installRoutes(page);
        const requests: string[] = [];
        page.on('request', request => requests.push(request.url()));

        const resourceUrl = encodeURIComponent(
            `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}`
        );
        await page.goto(
            `/patient/wsiHESlides?studyId=${STUDY_ID}&caseId=${PATIENT_ID}&resourceUrl=${resourceUrl}`
        );
        await expect(
            page.locator('[data-testid="wsi-share-button"]')
        ).toBeVisible({ timeout: 30000 });

        const wsiRequests = requests
            .map(url => new URL(url, page.url()))
            .filter(
                request =>
                    request.pathname.startsWith('/api/wsi/') ||
                    request.pathname.startsWith('/wsi/')
            );
        expect(
            wsiRequests.some(request =>
                request.pathname.startsWith('/api/wsi/v2/hierarchy/')
            )
        ).toBe(true);
        expect(
            wsiRequests.some(request =>
                request.pathname.startsWith('/wsi/tiles/')
            )
        ).toBe(true);
        const thumbnailRequest = wsiRequests.find(
            request => request.pathname === '/wsi/thumbnails'
        );
        expect(thumbnailRequest).toBeDefined();
        expect(thumbnailRequest?.searchParams.get('width')).toBe('128');
        expect(thumbnailRequest?.searchParams.get('height')).toBe('96');
        expect(thumbnailRequest?.searchParams.get('source')).toBe(
            's3://mock-bucket/mock-hne-1.thumb.jpg'
        );
        await expect(
            page.locator('[data-testid="wsi-slide-thumbnail-mock-hne-1"] img')
        ).toHaveAttribute('src', /^blob:/);
        expect(
            wsiRequests.every(
                request => request.origin === new URL(page.url()).origin
            )
        ).toBe(true);
    });
});

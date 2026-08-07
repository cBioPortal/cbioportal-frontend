import { test, expect } from '../fixtures';

const STUDY_ID = 'brca_tcga';
const PATIENT_ID = 'TCGA-A1-A0SB';
const SAMPLE_ID = `${PATIENT_ID}-T01`;

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
                    partDescription: 'Breast',
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
                                    matchLevel: 'PART',
                                    specimenKey: 'part::1',
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
                                    matchLevel: 'PART',
                                    specimenKey: 'part::1',
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
                    partDescription: 'Breast',
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
            { key: 'MATCH_LEVEL', value: 'PART' },
            { key: 'SPECIMEN', value: 'Backend-only specimen' },
            { key: 'IMAGE_COUNT', value: '9' },
            { key: 'NON_SERVABLE_IMAGE_COUNT', value: '0' },
            { key: 'TOTAL_IMAGE_COUNT', value: '9' },
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
    cancerTypeId: 'brca',
    name: 'Mock Breast Study',
    publicStudy: true,
    groups: 'PUBLIC',
    status: 0,
    referenceGenome: 'hg19',
    cancerType: {
        id: 'brca',
        name: 'Breast Cancer',
        shortName: 'BRCA',
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

    await page.route('**/wsi/tiles/*/metadata**', async route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(metadata),
        })
    );

    await page.route('**/wsi/thumbnails/*', async route =>
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

    await page.route('**/wsi/tiles/*/zxy/*', async route =>
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
    test('summary and Clinical Data preserve backend WSI events when hierarchy data is available', async ({
        page,
    }) => {
        await configureMockedWsi(page);
        await installRoutes(page, backendPathologyClinicalEvents);

        await page.goto(patientUrl('patient/summary'));
        await expect(page.locator('.tl-timeline-svg')).toBeVisible({
            timeout: 30000,
        });
        await expect(page.locator('.tl-timeline-tracklabels')).toContainText(
            'PATHOLOGY'
        );
        await expect(page.locator('.tl-timeline-tracklabels')).toContainText(
            'Slides'
        );

        await page.goto(patientUrl('patient/clinicalData'));
        await expect(
            page.locator('body')
        ).toContainText('Backend-only specimen', { timeout: 30000 });
        await expect(page.locator('body')).toContainText('9');
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
            page.getByText('View 1 of 1', { exact: true })
        ).toHaveCount(2);
        await expect(pathologyTable).toContainText('Unmatched');
        await expect(page.locator('body')).not.toContainText(/WSI TIMEPOINT/i);
        await expect(page.locator('body')).not.toContainText(/HAS WSI SLIDE/i);
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
        const thumbnailRequest = wsiRequests.find(request =>
            request.pathname.startsWith('/wsi/thumbnails/')
        );
        expect(thumbnailRequest).toBeDefined();
        expect(thumbnailRequest?.searchParams.get('width')).toBe('128');
        expect(thumbnailRequest?.searchParams.get('height')).toBe('96');
        expect(thumbnailRequest?.searchParams.get('studyId')).toBe(STUDY_ID);
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

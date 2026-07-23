import { test, expect } from '../fixtures';

const STUDY_ID = 'brca_tcga';
const PATIENT_ID = 'TCGA-A1-A0SB';
const SAMPLE_ID = `${PATIENT_ID}-T01`;

const hierarchy = {
    patient_id: PATIENT_ID,
    samples: [
        {
            sample_id: SAMPLE_ID,
            cancer_type: 'Breast Cancer',
            cancer_type_detailed: 'Breast Invasive Carcinoma',
            oncotree_code: 'BRCA',
            primary_site: 'Breast',
            sample_type: 'Primary Solid Tumor',
            parts: [
                {
                    part_number: '1',
                    part_designator: '1',
                    part_type: '',
                    part_description: 'Breast',
                    subspecialty: '',
                    path_dx_title: '',
                    blocks: [
                        {
                            block_number: '1',
                            block_label: 'A1',
                            slides: [
                                {
                                    image_id: 'mock-hne-1',
                                    stain_name: 'H&E initial',
                                    stain_group: 'H&E (Initial)',
                                    is_hne: true,
                                    is_ihc: false,
                                    magnification: '',
                                    file_size_bytes: '',
                                    can_serve_tiles: true,
                                    barcode: '',
                                    block_label: 'A1',
                                    block_number: '1',
                                    slide_timepoint_days: -10,
                                    slide_timepoint_source: 'Procedure date',
                                },
                                {
                                    image_id: 'mock-ihc-1',
                                    stain_name: 'IHC recut',
                                    stain_group: 'IHC',
                                    is_hne: false,
                                    is_ihc: true,
                                    magnification: '',
                                    file_size_bytes: '',
                                    can_serve_tiles: true,
                                    barcode: '',
                                    block_label: 'A1',
                                    block_number: '1',
                                    slide_timepoint_days: -10,
                                    slide_timepoint_source: 'Procedure date',
                                },
                                {
                                    image_id: 'mock-unmatched-1',
                                    stain_name: 'H&E unlinked',
                                    stain_group: 'H&E (Initial)',
                                    is_hne: true,
                                    is_ihc: false,
                                    magnification: '',
                                    file_size_bytes: '',
                                    can_serve_tiles: false,
                                    barcode: '',
                                    block_label: 'A1',
                                    block_number: '1',
                                    slide_timepoint_days: -10,
                                    slide_timepoint_source: 'Procedure date',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
    slide_associations: [
        {
            image_id: 'mock-hne-1',
            sample_id: SAMPLE_ID,
            match_level: 'PART',
            specimen_key: 'part::1',
            part_number: '1',
            part_description: 'Breast',
            block_number: '1',
            block_label: 'A1',
            slide_type: 'H&E',
            stain_name: 'H&E initial',
            procedure_date_days: -10,
            timepoint_source: 'Procedure date',
            can_serve_tiles: true,
        },
        {
            image_id: 'mock-ihc-1',
            sample_id: SAMPLE_ID,
            match_level: 'PART',
            specimen_key: 'part::1',
            part_number: '1',
            part_description: 'Breast',
            block_number: '1',
            block_label: 'A1',
            slide_type: 'IHC',
            stain_name: 'IHC recut',
            procedure_date_days: -10,
            timepoint_source: 'Procedure date',
            can_serve_tiles: true,
        },
        {
            image_id: 'mock-unmatched-1',
            sample_id: null,
            match_level: 'UNMATCHED',
            specimen_key: 'unmatched::1',
            slide_type: 'H&E',
            stain_name: 'H&E unlinked',
            procedure_date_days: -10,
            timepoint_source: 'Procedure date',
            can_serve_tiles: false,
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

function configureMockedWsi(page: import('@playwright/test').Page) {
    return page.addInitScript(
        ({ tileServerUrl }) => {
            localStorage.setItem(
                'frontendConfig',
                JSON.stringify({
                    serverConfig: {
                        msk_wsi_tile_server_url: tileServerUrl,
                        msk_wsi_authentication_enabled: false,
                        msk_wsi_enable_bootstrap: false,
                    },
                })
            );
        },
        { tileServerUrl: '/wsi' }
    );
}

async function installRoutes(page: import('@playwright/test').Page) {
    await page.route(
        `**/api/studies/${STUDY_ID}/patients/${PATIENT_ID}/clinical-events**`,
        async route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(baseClinicalEvents),
            })
    );

    await page.route(`**/wsi/patient/${PATIENT_ID}**`, async route =>
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

    await page.route('**/wsi/tiles/*/thumbnail**', async route =>
        route.fulfill({
            status: 200,
            contentType: 'image/png',
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
            .filter(request => request.pathname.startsWith('/wsi/'));
        expect(
            wsiRequests.some(request =>
                request.pathname.startsWith('/wsi/patient/')
            )
        ).toBe(true);
        expect(
            wsiRequests.some(request =>
                request.pathname.startsWith('/wsi/tiles/')
            )
        ).toBe(true);
        expect(
            wsiRequests.every(
                request => request.origin === new URL(page.url()).origin
            )
        ).toBe(true);
    });
});

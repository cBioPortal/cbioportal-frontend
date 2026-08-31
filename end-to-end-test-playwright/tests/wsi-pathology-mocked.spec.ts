import { test, expect } from '../fixtures';
import { ensureLocalLogin } from './local/helpers';
import { WsiAgentProposal } from '../../src/shared/components/wsiViewer/wsiAgent';

const STUDY_ID = process.env.WSI_MOCK_STUDY_ID ?? 'msk_spectrum_tme_2022';
const PATIENT_ID = process.env.WSI_MOCK_PATIENT_ID ?? 'P-0055908';
const SAMPLE_ID = process.env.WSI_MOCK_SAMPLE_ID ?? 'P-0055908-T01-IM6';

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

function annotationRecord(
    id: string,
    label: string,
    layer: string,
    type: string,
    selector: { type: string; value: string }
) {
    return {
        id,
        body: { label, comment: layer, type },
        target: { selector },
        version: 1,
        created_at: '2025-01-01T00:00:00Z',
        created_by: 'mock-user',
    };
}

type AnnotationPayload = {
    body?: { label?: string; comment?: string; type?: string };
    target?: { selector?: { type: string; value: string } };
    version?: number;
};

type AnnotationRequest = {
    method: string;
    authorization: string;
    body?: AnnotationPayload;
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

async function configureMockedWsi(page: import('@playwright/test').Page) {
    await page.addInitScript(
        ({ tileServerUrl }) => {
            localStorage.setItem(
                'frontendConfig',
                JSON.stringify({
                    serverConfig: {
                        msk_wsi_tile_server_url: tileServerUrl,
                        msk_wsi_annotation_api_url: tileServerUrl,
                        msk_wsi_authentication_enabled: false,
                    },
                })
            );
        },
        { tileServerUrl: '/wsi' }
    );
    await page.route('**/config_service', async route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                app_name: 'public-portal',
                authenticationMethod: 'none',
                msk_wsi_tile_server_url: '/wsi',
                msk_wsi_annotation_api_url: '/wsi',
                msk_wsi_authentication_enabled: false,
            }),
        })
    );
}

async function installRoutes(
    page: import('@playwright/test').Page,
    clinicalEvents = baseClinicalEvents,
    hierarchyPayload = hierarchy
) {
    const annotations = [
        annotationRecord(
            'default-annotation',
            'Default region',
            'Default',
            'Default|#3b82f6',
            {
                type: 'FragmentSelector',
                value: 'xywh=pixel:40,40,80,70',
            }
        ),
        annotationRecord(
            'tumor-annotation',
            'Tumor region',
            'Tumor',
            'Tumor|#ef4444',
            {
                type: 'SvgSelector',
                value:
                    '<svg><ellipse cx="220" cy="180" rx="35" ry="25" /></svg>',
            }
        ),
    ];
    const annotationRequests: AnnotationRequest[] = [];

    // Keep the mocked viewer suite independent of the cBioPortal backend used
    // to serve the development bundle. These calls happen during app boot,
    // before the patient-specific routes below are requested.
    await page.route('**/api/studies**', async route => {
        const url = new URL(route.request().url());
        if (url.pathname === '/api/studies') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([baseStudy]),
            });
            return;
        }
        if (url.pathname.endsWith('/resource-definitions')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            });
            return;
        }
        if (url.pathname.endsWith('/significantly-mutated-genes')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            });
            return;
        }
        await route.fallback();
    });
    await page.route('**/api/cancer-types', async route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        })
    );
    await page.route('**/api/gene-panel-data/fetch', async route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        })
    );

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
                body: JSON.stringify(hierarchyPayload),
            })
    );

    await page.route('**/wsi/annotations**', async route => {
        const request = route.request();
        const method = request.method();
        const requestBody = request.postDataJSON() as
            | AnnotationPayload
            | undefined;
        annotationRequests.push({
            method,
            authorization: request.headers().authorization || '',
            body: requestBody,
        });
        const path = new URL(request.url()).pathname;
        const id = decodeURIComponent(path.split('/annotations/')[1] || '');

        if (method === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(annotations),
            });
            return;
        }
        if (method === 'POST' && requestBody) {
            const selector = requestBody.target?.selector;
            if (!selector) {
                await route.fulfill({ status: 400 });
                return;
            }
            const created = annotationRecord(
                `created-${annotations.length + 1}`,
                requestBody.body?.label || '',
                requestBody.body?.comment || 'Default',
                requestBody.body?.type || 'Default|#3b82f6',
                selector
            );
            annotations.push(created);
            await route.fulfill({
                status: 201,
                contentType: 'application/json',
                body: JSON.stringify(created),
            });
            return;
        }
        if (method === 'PUT' && requestBody) {
            const index = annotations.findIndex(
                annotation => annotation.id === id
            );
            if (index === -1) {
                await route.fulfill({ status: 404 });
                return;
            }
            const updated = {
                ...annotations[index],
                body: {
                    ...annotations[index].body,
                    ...requestBody.body,
                },
                target: requestBody.target?.selector
                    ? { selector: requestBody.target.selector }
                    : annotations[index].target,
                version: annotations[index].version + 1,
            };
            annotations[index] = updated;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(updated),
            });
            return;
        }
        if (method === 'DELETE') {
            const index = annotations.findIndex(
                annotation => annotation.id === id
            );
            if (index >= 0) annotations.splice(index, 1);
            await route.fulfill({ status: 204 });
            return;
        }
        await route.fulfill({ status: 405 });
    });

    await page.route('**/api/clinical-data/fetch**', async route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        })
    );

    await page.route(
        `**/api/studies/${STUDY_ID}/molecular-profiles**`,
        async route => {
            const alterationType = new URL(
                route.request().url()
            ).searchParams.get('molecularAlterationType');
            const profileId =
                alterationType === 'COPY_NUMBER_ALTERATION'
                    ? 'mock-cna'
                    : alterationType === 'STRUCTURAL_VARIANT'
                    ? 'mock-sv'
                    : 'mock-mutations';
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        molecularProfileId: profileId,
                        molecularAlterationType: alterationType,
                    },
                ]),
            });
        }
    );

    await page.route('**/api/mutations/fetch**', async route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    sampleId: SAMPLE_ID,
                    entrezGeneId: 3845,
                    gene: {
                        hugoGeneSymbol: 'KRAS',
                        entrezGeneId: 3845,
                    },
                    proteinChange: 'p.G12D',
                    mutationType: 'Missense_Mutation',
                    tumorAltCount: 20,
                    tumorRefCount: 80,
                    proteinPosStart: 12,
                    proteinPosEnd: 12,
                },
            ]),
        })
    );

    await page.route(
        '**/api/molecular-profiles/mock-cna/molecular-data/fetch**',
        async route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        sampleId: SAMPLE_ID,
                        value: 2,
                        entrezGeneId: 7157,
                        gene: {
                            entrezGeneId: 7157,
                            hugoGeneSymbol: 'TP53',
                            cytoband: '17p13.1',
                        },
                    },
                ]),
            })
    );

    await page.route('**/api/cna-genes/fetch**', async route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        })
    );

    await page.route('**/api/structural-variant/fetch**', async route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    sampleId: SAMPLE_ID,
                    site1HugoSymbol: 'EML4',
                    site2HugoSymbol: 'ALK',
                    site1EntrezGeneId: 27436,
                    site2EntrezGeneId: 238,
                    variantClass: 'FUSION',
                    svStatus: 'SOMATIC',
                },
            ]),
        })
    );

    await page.route(
        '**/api/mutation-counts-by-position/fetch**',
        async route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            })
    );

    await page.route(`**/api/wsi/slides/${STUDY_ID}/*/access`, async route => {
        const pathSegments = new URL(route.request().url()).pathname.split('/');
        const imageId = decodeURIComponent(
            pathSegments[pathSegments.length - 2] ?? ''
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
    });

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

    return { annotations, annotationRequests };
}

function patientUrl(path: string) {
    return `/${path}?studyId=${STUDY_ID}&caseId=${PATIENT_ID}`;
}

function viewerUrl(slideId = 'mock-hne-1') {
    return `${patientUrl(
        'patient/wsiHESlides'
    )}#wsi:slide=${slideId}&x=256&y=256&z=0.75`;
}

function wsiHashState(url: string) {
    const hash = new URL(url).hash.replace(/^#wsi:/, '');
    const values = new URLSearchParams(hash);
    return {
        x: Number(values.get('x')),
        y: Number(values.get('y')),
        z: Number(values.get('z')),
    };
}

async function dragOnViewer(
    page: import('@playwright/test').Page,
    startX: number,
    startY: number,
    endX: number,
    endY: number
) {
    const canvas = page.locator('.openseadragon-canvas').first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    const start = {
        x: box!.x + box!.width * startX,
        y: box!.y + box!.height * startY,
    };
    const end = {
        x: box!.x + box!.width * endX,
        y: box!.y + box!.height * endY,
    };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 8 });
    await page.mouse.up();
}

async function gotoWithOptionalLogin(
    page: import('@playwright/test').Page,
    url: string
) {
    await page.goto(url);
    await Promise.race([
        page.locator('#username').waitFor({ state: 'visible', timeout: 10000 }),
        page
            .locator('[data-testid="wsi-filtered-slide-count"]')
            .waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => undefined);
    if (
        await page
            .locator('#username')
            .isVisible()
            .catch(() => false)
    ) {
        await page
            .locator('#username')
            .fill(process.env.KEYCLOAK_USERNAME ?? 'testuser');
        await page
            .locator('#password')
            .fill(process.env.KEYCLOAK_PASSWORD ?? 'P@ssword1');
        await Promise.all([
            page.waitForURL(
                currentUrl =>
                    !currentUrl.toString().includes('/auth/realms/') &&
                    !currentUrl.toString().includes('/login/saml2/') &&
                    !currentUrl.toString().includes('/saml2/authenticate'),
                { timeout: 30000, waitUntil: 'load' }
            ),
            page.locator('#kc-login').click(),
        ]);
        await page.goto(url);
    }
}

test.describe('native WSI pathology contract with mocked services', () => {
    test.beforeEach(async ({ page }) => {
        if (process.env.WSI_MOCK_SKIP_LOGIN === '1') return;
        await ensureLocalLogin(page, '/');
    });

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
        // Clearing a linkout scope removes the transient query parameter; the
        // patient route is the unscoped default.
        expect(afterMatchAll.searchParams.get('wsiScope')).toBeNull();

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
        expect(new URL(page.url()).searchParams.get('wsiScope')).toBeNull();
    });

    test('viewer uses only same-origin mocked hierarchy, metadata, and tile requests', async ({
        page,
    }) => {
        await configureMockedWsi(page);
        await installRoutes(page);
        const requests: string[] = [];
        const thumbnailSources: string[] = [];
        page.on('request', request => {
            requests.push(request.url());
            if (new URL(request.url()).pathname === '/wsi/thumbnails') {
                thumbnailSources.push(request.headers()['x-wsi-source'] || '');
            }
        });

        const resourceUrl = encodeURIComponent(
            `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}`
        );
        await gotoWithOptionalLogin(
            page,
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
        expect(thumbnailSources).toContain(
            's3://mock-bucket/mock-hne-1.thumb.jpg'
        );
        expect(
            thumbnailSources.filter(
                source => source === 's3://mock-bucket/mock-hne-1.thumb.jpg'
            )
        ).toHaveLength(1);
        await expect(
            page.locator('[data-testid="wsi-slide-thumbnail-mock-hne-1"] img')
        ).toHaveAttribute('src', /^blob:/);
        await expect(
            page.locator('[data-testid="wsi-match-filter-unmatched"]')
        ).toHaveCount(0);
        await expect(
            page.locator('[data-testid="wsi-slide-item-mock-unmatched-1"]')
        ).toHaveCount(0);
        await expect(
            page.locator('[data-testid="wsi-metadata-sidebar"] img')
        ).toHaveCount(0);
        expect(
            wsiRequests.every(
                request => request.origin === new URL(page.url()).origin
            )
        ).toBe(true);
    });

    test('renders reference-sample mutations, CNAs, and structural variants on the RHS', async ({
        page,
    }) => {
        await configureMockedWsi(page);
        await installRoutes(page);

        await gotoWithOptionalLogin(page, viewerUrl());
        const sidebar = page.locator('[data-testid="wsi-metadata-sidebar"]');
        await expect(sidebar).toContainText('MSK-IMPACT', { timeout: 30000 });
        await expect(sidebar).toContainText('KRAS');
        await expect(sidebar).toContainText('G12D');
        await expect(sidebar).toContainText('TP53');
        await expect(sidebar).toContainText('AMP');
        await expect(sidebar).toContainText('EML4');
        await expect(sidebar).toContainText('ALK');
        await expect(sidebar).toContainText('FUSION');
    });

    test('uses the reference sample for RHS variants when an unmatched slide is selected', async ({
        page,
    }) => {
        const hierarchyWithServableUnmatched = JSON.parse(
            JSON.stringify(hierarchy)
        );
        hierarchyWithServableUnmatched.sampleGroups[1].parts[0].blocks[0].slides[0].canServeTiles = true;
        await configureMockedWsi(page);
        await installRoutes(
            page,
            baseClinicalEvents,
            hierarchyWithServableUnmatched
        );

        await gotoWithOptionalLogin(page, viewerUrl('mock-unmatched-1'));
        await expect(
            page.locator('[data-testid="wsi-slide-item-mock-unmatched-1"]')
        ).toBeVisible({ timeout: 30000 });
        const sidebar = page.locator('[data-testid="wsi-metadata-sidebar"]');
        await expect(sidebar).toContainText('KRAS', { timeout: 30000 });
        await expect(sidebar).toContainText('G12D');
    });

    test('covers annotation layers, colors, CRUD, every drawing tool, and post-draw navigation', async ({
        page,
    }) => {
        await configureMockedWsi(page);
        const { annotationRequests } = await installRoutes(page);
        const unauthorizedResponses: string[] = [];
        page.on('response', response => {
            const pathname = new URL(response.url()).pathname;
            if (
                response.status() === 401 &&
                (pathname.startsWith('/api/wsi/') ||
                    pathname.startsWith('/wsi/'))
            ) {
                unauthorizedResponses.push(response.url());
            }
        });

        await gotoWithOptionalLogin(page, viewerUrl());
        await expect(
            page.locator('[data-testid="wsi-annotation-toolbar"]')
        ).toBeVisible({ timeout: 30000 });
        await expect(
            page.locator('[data-testid="annotation-row-default-annotation"]')
        ).toBeVisible();
        await expect(
            page.locator('[data-testid="annotation-row-tumor-annotation"]')
        ).toBeVisible();
        await expect(
            page.locator('[data-testid="layer-select-Tumor"]')
        ).toBeVisible();

        await page.locator('[data-testid="layer-toggle-Tumor"]').click();
        await expect(
            page.locator('[data-testid="annotation-row-tumor-annotation"]')
        ).toHaveCount(0);
        await expect(
            page.locator('[data-testid="layer-toggle-Tumor"]')
        ).toHaveAttribute('title', /^Show layer/);
        await page.locator('[data-testid="layer-toggle-Tumor"]').click();
        await expect(
            page.locator('[data-testid="annotation-row-tumor-annotation"]')
        ).toBeVisible();

        await page.locator('[data-testid="add-layer-btn"]').click();
        await page.locator('[data-testid="add-layer-input"]').fill('Review');
        await page.locator('[data-testid="add-layer-confirm"]').click();
        await expect(
            page.locator('[data-testid="layer-select-Review"]')
        ).toHaveAttribute('aria-pressed', 'true');

        await page.locator('[data-testid="add-annotation-color"]').click();
        await page.getByLabel('Custom annotation color name').fill('Review');
        await page
            .getByLabel('Custom annotation color', { exact: true })
            .fill('#00aa55');
        await page.locator('[data-testid="save-annotation-color"]').click();
        await expect(
            page.locator('[data-testid="annotation-color-Review"]')
        ).toHaveAttribute('aria-pressed', 'true');

        const dragTools = [
            ['rectangle', '<rect'],
            ['ellipse', '<ellipse'],
            ['circle', '<ellipse'],
            ['line', '<line'],
        ] as const;
        for (let index = 0; index < dragTools.length; index += 1) {
            const [tool] = dragTools[index];
            await page
                .locator(`[data-testid="annotation-tool-${tool}"]`)
                .click();
            await dragOnViewer(
                page,
                0.3 + index * 0.03,
                0.35,
                0.42 + index * 0.03,
                0.48
            );
            await expect
                .poll(
                    () =>
                        annotationRequests.filter(
                            request => request.method === 'POST'
                        ).length
                )
                .toBe(index + 1);
            await expect(
                page.locator(`[data-testid="annotation-tool-${tool}"]`)
            ).toHaveAttribute('aria-pressed', 'false');
        }

        await page.locator('[data-testid="annotation-tool-polygon"]').click();
        const canvas = page.locator('.openseadragon-canvas').first();
        const box = await canvas.boundingBox();
        expect(box).not.toBeNull();
        const polygonPoints = [
            [0.58, 0.36],
            [0.7, 0.36],
            [0.68, 0.5],
            [0.58, 0.36],
        ];
        for (const [x, y] of polygonPoints) {
            await page.mouse.click(
                box!.x + box!.width * x,
                box!.y + box!.height * y
            );
        }
        await expect
            .poll(
                () =>
                    annotationRequests.filter(
                        request => request.method === 'POST'
                    ).length
            )
            .toBe(5);
        await expect(
            page.locator('[data-testid="annotation-tool-polygon"]')
        ).toHaveAttribute('aria-pressed', 'false');

        const postRequests = annotationRequests.filter(
            request => request.method === 'POST'
        );
        expect(postRequests).toHaveLength(5);
        dragTools.forEach(([, selectorTag], index) => {
            expect(postRequests[index].body?.target?.selector?.value).toContain(
                selectorTag
            );
        });
        expect(postRequests[4].body?.target?.selector?.value).toContain(
            '<polygon'
        );
        postRequests.forEach(request => {
            expect(request.body?.body?.comment).toBe('Review');
            expect(request.body?.body?.type).toBe('Review|#00aa55');
            expect(request.body?.body?.label).toMatch(/^Review \d+$/);
        });

        const createdRow = page.locator(
            '[data-testid="annotation-row-created-3"]'
        );
        await expect(createdRow).toBeVisible();
        await createdRow
            .locator('[data-testid="edit-label-created-3"]')
            .click();
        await createdRow
            .locator('[data-testid="annotation-label-input-created-3"]')
            .fill('Reviewed region');
        await createdRow
            .locator('[data-testid="annotation-label-input-created-3"]')
            .press('Enter');
        await expect
            .poll(
                () =>
                    annotationRequests.filter(
                        request => request.method === 'PUT'
                    ).length
            )
            .toBe(1);
        await expect(createdRow).toContainText('Reviewed region');
        await createdRow
            .locator('[data-testid="delete-annotation-created-3"]')
            .click();
        await expect(createdRow).toHaveCount(0);
        await expect
            .poll(
                () =>
                    annotationRequests.filter(
                        request => request.method === 'DELETE'
                    ).length
            )
            .toBe(1);

        await expect(page).toHaveURL(/#wsi:/);
        const beforeZoom = wsiHashState(page.url());
        await page.locator('button[title="Zoom in"]').click();
        await expect
            .poll(() => wsiHashState(page.url()).z)
            .not.toBe(beforeZoom.z);
        const beforePan = wsiHashState(page.url());
        await dragOnViewer(page, 0.5, 0.55, 0.62, 0.63);
        await expect
            .poll(() => {
                const current = wsiHashState(page.url());
                return current.x !== beforePan.x || current.y !== beforePan.y;
            })
            .toBe(true);

        expect(unauthorizedResponses).toEqual([]);
        expect(
            annotationRequests.some(request => request.method === 'GET')
        ).toBe(true);
    });

    test('keeps assistant proposals gated until Apply and never calls OpenAI from the browser', async ({
        page,
    }) => {
        await configureMockedWsi(page);
        const { annotationRequests } = await installRoutes(page);
        const proposal: WsiAgentProposal = {
            id: 'agent-proposal-1',
            session_id: 'browser-session',
            action_type: 'create_annotation',
            study_id: STUDY_ID,
            slide_id: 'mock-hne-1',
            payload: {
                geometry_type: 'rectangle',
                points: [
                    { x: 100, y: 100 },
                    { x: 300, y: 300 },
                ],
                label: 'AI review region',
                layer_name: 'AI review',
                color: '#ef4444',
                rationale: 'Coarse region for researcher review.',
            },
            status: 'pending',
            created_at: '2026-01-01T00:00:00Z',
        };
        await page.route('**/api/wsi/access-token**', async route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: 'mock-annotation-token',
                    expires_in: 300,
                }),
            })
        );
        await page.route('**/wsi/agent/chat', async route =>
            route.fulfill({
                status: 200,
                contentType: 'text/event-stream',
                body:
                    'event: message.delta\ndata: {"text":"I found a region to review."}\n\n' +
                    `event: proposal\ndata: ${JSON.stringify(proposal)}\n\n` +
                    'event: complete\ndata: {"proposal_ids":["agent-proposal-1"]}\n\n',
            })
        );
        await page.route('**/wsi/agent/actions/**', async route => {
            const path = new URL(route.request().url()).pathname;
            if (path.endsWith('/apply')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({ ...proposal, status: 'approved' }),
                });
                return;
            }
            if (path.endsWith('/complete')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        ...proposal,
                        status: 'completed',
                        outcome: {
                            success: true,
                            detail: 'Annotation created.',
                        },
                    }),
                });
                return;
            }
            await route.fulfill({ status: 405 });
        });
        const browserOpenAiRequests: string[] = [];
        page.on('request', request => {
            if (new URL(request.url()).hostname === 'api.openai.com') {
                browserOpenAiRequests.push(request.url());
            }
        });

        await gotoWithOptionalLogin(page, viewerUrl());
        await expect(
            page.locator('[data-testid="wsi-agent-panel"]')
        ).toBeVisible({ timeout: 30000 });
        await page
            .getByLabel('Ask the research assistant')
            .fill('Mark a region for review');
        await page.getByRole('button', { name: 'Send' }).click();
        await expect(
            page.locator('[data-testid="wsi-agent-apply-agent-proposal-1"]')
        ).toBeVisible({ timeout: 30000 });
        expect(
            annotationRequests.filter(request => request.method === 'POST')
        ).toHaveLength(0);
        expect(browserOpenAiRequests).toEqual([]);

        await page
            .locator('[data-testid="wsi-agent-apply-agent-proposal-1"]')
            .click();
        await expect
            .poll(
                () =>
                    annotationRequests.filter(
                        request => request.method === 'POST'
                    ).length
            )
            .toBe(1);
        expect(browserOpenAiRequests).toEqual([]);
    });
});

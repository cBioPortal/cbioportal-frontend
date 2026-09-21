import { Page } from '../fixtures';

export const STUDY_ID = 'wsi-foundation-smoke-study';
export const PATIENT_ID = 'wsi-foundation-smoke-patient';
export const IMAGE_ID = 'wsi-foundation-smoke-slide';

const tileMetadata = {
    dimensions: { width: 512, height: 512 },
    levels: 1,
    level_dimensions: [{ width: 512, height: 512 }],
    level_downsamples: [1],
    max_zoom: 0,
    tile_metadata_schema_version: 2,
    decode_policy_version:
        'geometry-v2;tile-max=16777216;thumbnail-max=16777216',
    max_decode_pixels: 16_777_216,
    thumbnail_max_decode_pixels: 16_777_216,
    safe_min_level: 0,
    tile_size: 256,
};

const hierarchy = {
    referenceSampleId: 'wsi-foundation-smoke-sample',
    sampleGroups: [
        {
            sampleId: 'wsi-foundation-smoke-sample',
            parts: [
                {
                    partNumber: '1',
                    partDesignator: '1',
                    partType: '',
                    partDescription: 'Foundation specimen',
                    subspecialty: '',
                    pathDxTitle: '',
                    blocks: [
                        {
                            blockNumber: 'A1',
                            blockLabel: 'A1',
                            slides: [
                                {
                                    imageId: IMAGE_ID,
                                    stainName: 'H&E initial',
                                    stainGroup: 'H&E (Initial)',
                                    isHne: true,
                                    isIhc: false,
                                    magnification: '',
                                    fileSizeBytes: null,
                                    canServeTiles: true,
                                    barcode: '',
                                    slideType: 'H&E',
                                    sampleId: 'wsi-foundation-smoke-sample',
                                    matchLevel: 'BLOCK',
                                    specimenKey: 'block::1::A1',
                                    procedureDateDays: -10,
                                    timepointSource: 'Procedure date',
                                    procedureDateKind: 'RECORDED',
                                    procedureDateSource:
                                        'Recorded procedure date',
                                    procedureDateReason: null,
                                    procedureDateStatus: 'AVAILABLE',
                                    procedureCoordinateSystem:
                                        'patient_first_tumor_sequencing_day_zero',
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
);

export async function installFoundationMocks(page: Page): Promise<string[]> {
    const enrichmentRequests: string[] = [];
    await page.addInitScript(() => {
        window.localStorage.setItem(
            'frontendConfig',
            JSON.stringify({
                serverConfig: {
                    msk_wsi_tile_server_url: '/wsi',
                    msk_wsi_authentication_enabled: false,
                },
            })
        );
    });
    page.on('request', request => {
        if (/annotate|oncokb|civic/i.test(request.url())) {
            enrichmentRequests.push(request.url());
        }
    });
    await page.route('**/config_service', route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                app_name: 'wsi-foundation-smoke',
                authenticationMethod: 'none',
                msk_wsi_tile_server_url: '/wsi',
                msk_wsi_authentication_enabled: false,
            }),
        })
    );
    await page.route(
        `**/api/wsi/v2/hierarchy/${STUDY_ID}/${PATIENT_ID}`,
        route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(hierarchy),
            })
    );
    await page.route(`**/api/studies/${STUDY_ID}/molecular-profiles**`, route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        })
    );
    await page.route(`**/api/wsi/v2/slides/${STUDY_ID}/*/access`, route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                imageId: IMAGE_ID,
                sourceUrl: 's3://wsi-foundation-smoke/slide.svs',
                accessToken: 'wsi-foundation-smoke-token',
                tokenType: 'Bearer',
                expiresIn: 300,
                tileMetadata,
                thumbnail: {
                    sourceUrl: 's3://wsi-foundation-smoke/slide.png',
                    width: 1,
                    height: 1,
                    contentType: 'image/png',
                },
            }),
        })
    );
    await page.route('**/wsi/tiles/**', route =>
        route.fulfill({ status: 200, contentType: 'image/png', body: pixel })
    );
    await page.route('**/wsi/thumbnails**', route =>
        route.fulfill({ status: 200, contentType: 'image/png', body: pixel })
    );
    return enrichmentRequests;
}

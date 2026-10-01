import { Page } from '../fixtures';

export const STUDY_ID = 'wsi-foundation-smoke-study';
export const PATIENT_ID = 'wsi-foundation-smoke-patient';
export const IMAGE_ID = 'wsi-foundation-smoke-slide';
// Deliberately contains characters that must be percent-encoded in a URL.
export const SECOND_IMAGE_ID = 'wsi foundation/smoke #2';
export const RESOURCE_ID = 'WSI_SLIDE';
export const SAMPLE_ID = 'wsi-foundation-smoke-sample';
/** A sample attribute value the sidebar's Clinical section shows. */
export const CLINICAL_CANCER_TYPE = 'Lung Adenocarcinoma';

const RESOURCE_DATA_IDS: Record<string, string> = {
    [IMAGE_ID]: '101',
    [SECOND_IMAGE_ID]: '102',
};

export interface FoundationMockOptions {
    /** Adds a second servable slide with an ID that needs URL encoding. */
    includeSecondSlide?: boolean;
    /** Collects every slide access request URL. */
    accessRequests?: string[];
}

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

function makeSlide(imageId: string, stainName: string, stainGroup: string) {
    return {
        imageId,
        resourceId: RESOURCE_ID,
        resourceDataId: RESOURCE_DATA_IDS[imageId],
        stainName,
        stainGroup,
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
        procedureDateSource: 'Recorded procedure date',
        procedureDateReason: null,
        procedureDateStatus: 'AVAILABLE',
        procedureCoordinateSystem: 'patient_first_tumor_sequencing_day_zero',
    };
}

function makeHierarchy(includeSecondSlide: boolean) {
    const slides = [makeSlide(IMAGE_ID, 'H&E initial', 'H&E (Initial)')];
    if (includeSecondSlide) {
        slides.push(makeSlide(SECOND_IMAGE_ID, 'H&E recut', 'H&E (Recut)'));
    }
    return {
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
                                slides,
                            },
                        ],
                    },
                ],
            },
        ],
    };
}

const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
);

export async function installFoundationMocks(
    page: Page,
    options: FoundationMockOptions = {}
): Promise<string[]> {
    const enrichmentRequests: string[] = [];
    const hierarchy = makeHierarchy(!!options.includeSecondSlide);
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
    await page.route(
        `**/api/wsi/v2/resources/${STUDY_ID}/*/access?*`,
        route => {
            const url = new URL(route.request().url());
            options.accessRequests?.push(url.toString());
            const patientId = decodeURIComponent(
                url.pathname.split('/').slice(-2, -1)[0]
            );
            const imageId = url.searchParams.get('imageId') || '';
            const resourceDataId = RESOURCE_DATA_IDS[imageId];
            if (patientId !== PATIENT_ID || !resourceDataId) {
                return route.fulfill({ status: 404, body: '' });
            }
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    imageId,
                    sourceUrl: `s3://wsi-foundation-smoke/${resourceDataId}.svs`,
                    accessToken: 'wsi-foundation-smoke-token',
                    tokenType: 'Bearer',
                    expiresIn: 300,
                    tileMetadata,
                    thumbnail: {
                        sourceUrl: `s3://wsi-foundation-smoke/${resourceDataId}.png`,
                        width: 1,
                        height: 1,
                        contentType: 'image/png',
                    },
                }),
            });
        }
    );
    await installClinicalMocks(page);
    await page.route('**/wsi/tiles/**', route =>
        route.fulfill({ status: 200, contentType: 'image/png', body: pixel })
    );
    await page.route('**/wsi/thumbnails**', route =>
        route.fulfill({ status: 200, contentType: 'image/png', body: pixel })
    );
    return enrichmentRequests;
}

function json(body: unknown) {
    return {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
    };
}

/**
 * The study and patient clinical data read by the viewer's Clinical section:
 * one default patient attribute, one default sample attribute and one
 * hidden (priority 0) attribute.
 */
async function installClinicalMocks(page: Page): Promise<void> {
    const attribute = (
        clinicalAttributeId: string,
        displayName: string,
        priority: string,
        patientAttribute: boolean
    ) => ({
        clinicalAttributeId,
        displayName,
        description: displayName,
        datatype: 'STRING',
        priority,
        patientAttribute,
        studyId: STUDY_ID,
    });
    const datum = (
        clinicalAttributeId: string,
        value: string,
        sampleId?: string
    ) => ({
        clinicalAttributeId,
        value,
        patientId: PATIENT_ID,
        studyId: STUDY_ID,
        ...(sampleId ? { sampleId } : {}),
    });

    await page.route(
        new RegExp(`/api/studies/${STUDY_ID}/clinical-attributes(\\?.*)?$`),
        route =>
            route.fulfill(
                json([
                    attribute(
                        'CANCER_TYPE_DETAILED',
                        'Cancer Type Detailed',
                        '2000',
                        false
                    ),
                    attribute('SAMPLE_COUNT', 'Number of Samples', '1', true),
                    attribute(
                        'PATH_SLIDE_EXISTS',
                        'Slide Available',
                        '0',
                        false
                    ),
                ])
            )
    );
    await page.route(new RegExp(`/api/studies/${STUDY_ID}(\\?.*)?$`), route =>
        route.fulfill(
            json({ studyId: STUDY_ID, name: STUDY_ID, allSampleCount: 1 })
        )
    );
    await page.route('**/api/clinical-attributes/counts/fetch**', route =>
        route.fulfill(
            json([
                { clinicalAttributeId: 'CANCER_TYPE_DETAILED', count: 1 },
                { clinicalAttributeId: 'SAMPLE_COUNT', count: 1 },
                { clinicalAttributeId: 'PATH_SLIDE_EXISTS', count: 1 },
            ])
        )
    );
    await page.route(
        new RegExp(
            `/api/studies/${STUDY_ID}/patients/${PATIENT_ID}/clinical-data(\\?.*)?$`
        ),
        route => route.fulfill(json([datum('SAMPLE_COUNT', '1')]))
    );
    await page.route(
        new RegExp(
            `/api/studies/${STUDY_ID}/patients/${PATIENT_ID}/samples(\\?.*)?$`
        ),
        route =>
            route.fulfill(
                json([
                    {
                        sampleId: SAMPLE_ID,
                        patientId: PATIENT_ID,
                        studyId: STUDY_ID,
                    },
                ])
            )
    );
    await page.route('**/api/clinical-data/fetch**', route =>
        route.fulfill(
            json([
                datum('CANCER_TYPE_DETAILED', CLINICAL_CANCER_TYPE, SAMPLE_ID),
            ])
        )
    );
}

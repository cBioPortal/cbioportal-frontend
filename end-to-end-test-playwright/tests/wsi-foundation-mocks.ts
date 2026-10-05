import { Page } from '../fixtures';

export const STUDY_ID = 'wsi-foundation-smoke-study';
export const PATIENT_ID = 'wsi-foundation-smoke-patient';
/** Opaque 32-hex slide keys, as the backend publishes them. */
export const SLIDE_KEY = '0123456789abcdef0123456789abcdef';
export const SECOND_SLIDE_KEY = 'fedcba9876543210fedcba9876543210';
export const SAMPLE_ID = 'wsi-foundation-smoke-sample';
/** A sample attribute value the sidebar's Clinical section shows. */
export const CLINICAL_CANCER_TYPE = 'Lung Adenocarcinoma';

export interface FoundationMockOptions {
    /** Adds a second servable slide. */
    includeSecondSlide?: boolean;
    /** Collects every slide access request URL. */
    accessRequests?: string[];
    /** Collects the request headers of every tile and thumbnail request. */
    tileRequestHeaders?: Array<Record<string, string>>;
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

function makeSlide(slideKey: string, stainName: string, stainGroup: string) {
    return {
        slideKey,
        stainName,
        stainGroup,
        isHne: true,
        isIhc: false,
        magnification: '',
        fileSizeBytes: null,
        canServeTiles: true,
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
    const slides = [makeSlide(SLIDE_KEY, 'H&E initial', 'H&E (Initial)')];
    if (includeSecondSlide) {
        slides.push(makeSlide(SECOND_SLIDE_KEY, 'H&E recut', 'H&E (Recut)'));
    }
    return {
        referenceSampleId: 'wsi-foundation-smoke-sample',
        sampleGroups: [
            {
                sampleId: 'wsi-foundation-smoke-sample',
                parts: [
                    {
                        partNumber: '1',
                        partType: '',
                        partDescription: 'Foundation specimen',
                        subspecialty: '',
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
            const slideKey = url.searchParams.get('slideKey') || '';
            const published = hierarchy.sampleGroups.some(group =>
                group.parts.some(part =>
                    part.blocks.some(block =>
                        block.slides.some(slide => slide.slideKey === slideKey)
                    )
                )
            );
            // As the backend: 400 unless 32 hex, 404 for an unknown slide.
            if (!/^[0-9a-f]{32}$/.test(slideKey)) {
                return route.fulfill({ status: 400, body: '' });
            }
            if (patientId !== PATIENT_ID || !published) {
                return route.fulfill({ status: 404, body: '' });
            }
            return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    slideKey,
                    accessToken: 'wsi-foundation-smoke-token',
                    tokenType: 'Bearer',
                    expiresIn: 300,
                    tileMetadata,
                    thumbnail: {
                        width: 1,
                        height: 1,
                        contentType: 'image/png',
                    },
                }),
            });
        }
    );
    await installClinicalMocks(page);
    await page.route('**/wsi/tiles/**', route => {
        options.tileRequestHeaders?.push(route.request().headers());
        return route.fulfill({
            status: 200,
            contentType: 'image/png',
            body: pixel,
        });
    });
    await page.route('**/wsi/thumbnails**', route => {
        options.tileRequestHeaders?.push(route.request().headers());
        return route.fulfill({
            status: 200,
            contentType: 'image/png',
            body: pixel,
        });
    });
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

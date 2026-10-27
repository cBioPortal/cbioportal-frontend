import { Page } from '../fixtures';

export const STUDY_ID = 'wsi-foundation-smoke-study';
export const PATIENT_ID = 'wsi-foundation-smoke-patient';
/** Opaque 12-hex slide keys, as the backend publishes them. */
export const SLIDE_KEY = '0123456789ab';
export const SECOND_SLIDE_KEY = 'fedcba987654';
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

/** Schema-2 tile metadata the viewer accepts, carried by the slide rows. */
export const tileMetadata = {
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

/** One WSI_SAMPLE resource row, as the resource table API returns it. */
function makeSlideRow(slideKey: string, stainName: string, stainGroup: string) {
    return {
        studyId: STUDY_ID,
        resourceId: 'WSI_SAMPLE',
        patientId: PATIENT_ID,
        sampleId: SAMPLE_ID,
        metadata: {
            slide_key: slideKey,
            reference_sample_id: SAMPLE_ID,
            part_key: 'part:foundation',
            part_number: '1',
            part_description: 'Foundation specimen',
            block_key: 'block:foundation',
            block_number: 'A1',
            block_label: 'A1',
            stain_name: stainName,
            stain_group: stainGroup,
            is_hne: true,
            is_ihc: false,
            slide_type: 'H&E',
            can_serve_tiles: true,
            match_level: 'BLOCK',
            specimen_key: 'block::1::A1',
            serving: {
                key: slideKey,
                sealed_source: 'sealed',
                tile_metadata_json: tileMetadata,
                thumbnail_width: 128,
                thumbnail_height: 96,
                thumbnail_content_type: 'image/png',
            },
        },
    };
}

function makeSlideRows(includeSecondSlide: boolean) {
    const rows = [makeSlideRow(SLIDE_KEY, 'H&E initial', 'H&E (Initial)')];
    if (includeSecondSlide) {
        rows.push(makeSlideRow(SECOND_SLIDE_KEY, 'H&E recut', 'H&E (Recut)'));
    }
    return rows;
}

/** A 1×1 PNG, for tile and thumbnail mocks. */
export const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
);

/**
 * Resource access as the backend answers it for a slide:
 * `GET /api/resources/{study}/{resource}/access?key=…&patientId=…`. 400 unless
 * the key is 12 hex, 404 for a row `isPublished` rejects, else a token.
 */
export async function routeSlideAccess(
    page: Page,
    studyId: string,
    isPublished: (
        resourceId: string,
        patientId: string,
        key: string
    ) => boolean,
    accessRequests?: string[]
): Promise<void> {
    await page.route(`**/api/resources/${studyId}/*/access?*`, route => {
        const url = new URL(route.request().url());
        accessRequests?.push(url.toString());
        const resourceId = decodeURIComponent(
            url.pathname.split('/').slice(-2, -1)[0]
        );
        const patientId = url.searchParams.get('patientId') || '';
        const key = url.searchParams.get('key') || '';
        if (!/^[0-9a-f]{12}$/.test(key)) {
            return route.fulfill({ status: 400, body: '' });
        }
        if (!isPublished(resourceId, patientId, key)) {
            return route.fulfill({ status: 404, body: '' });
        }
        return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                resourceId,
                key,
                accessToken: 'wsi-foundation-smoke-token',
                tokenType: 'Bearer',
                expiresIn: 300,
            }),
        });
    });
}

/** Answers every tile and thumbnail request with one pixel. */
export async function routeTilePixels(
    page: Page,
    requestHeaders?: Array<Record<string, string>>
): Promise<void> {
    for (const pattern of ['**/wsi/tiles/**', '**/wsi/thumbnails**']) {
        await page.route(pattern, route => {
            requestHeaders?.push(route.request().headers());
            return route.fulfill({
                status: 200,
                contentType: 'image/png',
                body: pixel,
            });
        });
    }
}

export async function installFoundationMocks(
    page: Page,
    options: FoundationMockOptions = {}
): Promise<string[]> {
    const enrichmentRequests: string[] = [];
    const slideRows = makeSlideRows(!!options.includeSecondSlide);
    await page.addInitScript(() => {
        window.localStorage.setItem(
            'frontendConfig',
            JSON.stringify({
                serverConfig: {
                    wsi_tile_server_url: '/wsi',
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
                wsi_tile_server_url: '/wsi',
            }),
        })
    );
    // The patient's slide rows: WSI_SAMPLE holds them all, and no other
    // resource has rows.
    await page.route('**/api/resource-table/query/fetch', route => {
        const query = route.request().postDataJSON();
        const rows =
            query?.resourceId === 'WSI_SAMPLE' &&
            query.patientIdentifiers?.some(
                (patient: { patientId: string }) =>
                    patient.patientId === PATIENT_ID
            )
                ? slideRows
                : [];
        return route.fulfill(json(rows));
    });
    await page.route(`**/api/studies/${STUDY_ID}/molecular-profiles**`, route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        })
    );
    await routeSlideAccess(
        page,
        STUDY_ID,
        (resourceId, patientId, key) =>
            patientId === PATIENT_ID &&
            slideRows.some(
                row =>
                    row.resourceId === resourceId &&
                    row.metadata.serving.key === key
            ),
        options.accessRequests
    );
    await installClinicalMocks(page);
    await routeTilePixels(page, options.tileRequestHeaders);
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

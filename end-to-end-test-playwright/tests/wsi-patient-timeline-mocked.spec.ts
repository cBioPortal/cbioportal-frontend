import { test, expect, Page } from '../fixtures';
import {
    installFoundationMocks,
    makeSlideRow,
    sealedSourceFor,
    STUDY_ID,
    PATIENT_ID,
    SAMPLE_ID,
    TileServerRequest,
} from './wsi-foundation-mocks';

/** A second sequenced sample, with later slides on two other parts. */
const LATER_SAMPLE_ID = 'wsi-foundation-smoke-sample-2';

/** Opaque 12-hex slide keys, as the backend publishes them. */
const HNE_KEY = '111111111111';
const IHC_KEY = '222222222222';
const LATER_KEY = '444444444444';
const OTHER_PART_KEY = '555555555555';
const ALL_KEYS = [HNE_KEY, IHC_KEY, LATER_KEY, OTHER_PART_KEY];

const BLOCK_SPECIMEN_KEY = 'block::1::A1';
const PART_SPECIMEN_KEY = 'part::2';
const OTHER_PART_SPECIMEN_KEY = 'part::3';

function slideRow(
    slideKey: string,
    stain: 'H&E' | 'IHC',
    sampleId: string,
    matchLevel: 'BLOCK' | 'PART',
    specimenKey: string,
    part: { number: string; description: string; block: string }
) {
    return makeSlideRow(
        slideKey,
        stain === 'IHC' ? 'IHC PD-L1' : 'H&E initial',
        stain,
        sampleId,
        {
            part_key: `part:${part.number}`,
            part_number: part.number,
            part_description: part.description,
            block_key: `block:${part.block}`,
            block_number: part.block,
            block_label: part.block,
            is_hne: stain === 'H&E',
            is_ihc: stain === 'IHC',
            slide_type: stain,
            match_level: matchLevel,
            specimen_key: specimenKey,
        }
    );
}

const PART_1 = { number: '1', description: 'Primary specimen', block: 'A1' };
const PART_2 = { number: '2', description: 'Recurrence specimen', block: 'B1' };
const PART_3 = { number: '3', description: 'Margin specimen', block: 'C1' };

/**
 * Sample 1, block A1: an H&E and an IHC slide. Sample 2, parts 2 and 3: an
 * H&E slide each. The slide rows carry no timing; the clinical events do.
 */
const slideRows = [
    slideRow(HNE_KEY, 'H&E', SAMPLE_ID, 'BLOCK', BLOCK_SPECIMEN_KEY, PART_1),
    slideRow(IHC_KEY, 'IHC', SAMPLE_ID, 'BLOCK', BLOCK_SPECIMEN_KEY, PART_1),
    slideRow(
        LATER_KEY,
        'H&E',
        LATER_SAMPLE_ID,
        'PART',
        PART_SPECIMEN_KEY,
        PART_2
    ),
    slideRow(
        OTHER_PART_KEY,
        'H&E',
        LATER_SAMPLE_ID,
        'PART',
        OTHER_PART_SPECIMEN_KEY,
        PART_3
    ),
];

/**
 * A PATHOLOGY SLIDES LINKOUT: the Pathology Slides tab with its scope in the
 * `pathologySlideSettings` node.
 */
function slidesTabLinkout(
    sampleId: string,
    settings: {
        stainFilter: string;
        matchLevel: string;
        specimenKey?: string;
        partKey?: string;
    }
): string {
    const params = new URLSearchParams({
        studyId: STUDY_ID,
        caseId: PATIENT_ID,
        sampleId,
        pathologySlideSettings: JSON.stringify(settings),
    });
    return `/patient/wsiHESlides?${params.toString()}`;
}

const HNE_LINKOUT = slidesTabLinkout(SAMPLE_ID, {
    stainFilter: 'hne',
    matchLevel: 'BLOCK',
    specimenKey: BLOCK_SPECIMEN_KEY,
});

/** Sample 2's part 2 slides, scoped by part key rather than specimen key. */
const PART_LINKOUT = slidesTabLinkout(LATER_SAMPLE_ID, {
    stainFilter: 'hne',
    matchLevel: 'PART',
    partKey: `part:${PART_2.number}`,
});

function clinicalEvent(
    eventType: string,
    days: number,
    attributes: Record<string, string>
) {
    return {
        uniquePatientKey: `${PATIENT_ID}:${STUDY_ID}`,
        studyId: STUDY_ID,
        patientId: PATIENT_ID,
        eventType,
        startNumberOfDaysSinceDiagnosis: days,
        attributes: Object.entries(attributes).map(([key, value]) => ({
            key,
            value,
        })),
    };
}

/** A PATHOLOGY SLIDES clinical event: one stain's slides of a procedure. */
function pathologySlidesEvent(
    days: number,
    sampleId: string,
    subtype: 'H&E' | 'IHC',
    matchLevel: 'BLOCK' | 'PART',
    specimen: string,
    linkout: string
) {
    return clinicalEvent('PATHOLOGY SLIDES', days, {
        SAMPLE_ID: sampleId,
        SUBTYPE: subtype,
        MATCH_LEVEL: matchLevel,
        SPECIMEN: specimen,
        IMAGE_COUNT: '1',
        NON_SERVABLE_IMAGE_COUNT: '0',
        TOTAL_IMAGE_COUNT: '1',
        TIMEPOINT_SOURCE: 'Procedure date relative to diagnosis',
        LINKOUT: linkout,
    });
}

const clinicalEvents = [
    clinicalEvent('SEQUENCING', 0, { SAMPLE_ID }),
    pathologySlidesEvent(
        -10,
        SAMPLE_ID,
        'H&E',
        'BLOCK',
        'Part 1 / Block A1',
        HNE_LINKOUT
    ),
    pathologySlidesEvent(
        -10,
        SAMPLE_ID,
        'IHC',
        'BLOCK',
        'Part 1 / Block A1',
        slidesTabLinkout(SAMPLE_ID, {
            stainFilter: 'ihc',
            matchLevel: 'BLOCK',
            specimenKey: BLOCK_SPECIMEN_KEY,
        })
    ),
    pathologySlidesEvent(
        200,
        LATER_SAMPLE_ID,
        'H&E',
        'PART',
        'Part 2',
        PART_LINKOUT
    ),
];

function json(body: unknown) {
    return {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
    };
}

const study = {
    studyId: STUDY_ID,
    name: STUDY_ID,
    description: 'WSI patient timeline contract',
    cancerTypeId: 'mixed',
    cancerType: {
        cancerTypeId: 'mixed',
        name: 'Mixed',
        dedicatedColor: 'Black',
        shortName: 'MIXED',
        parent: 'tissue',
    },
    publicStudy: true,
    groups: 'PUBLIC',
    status: 0,
    referenceGenome: 'hg19',
    allSampleCount: 2,
};

const samples = [SAMPLE_ID, LATER_SAMPLE_ID].map(sampleId => ({
    studyId: STUDY_ID,
    patientId: PATIENT_ID,
    sampleId,
    sampleType: 'Primary Solid Tumor',
    uniquePatientKey: `${PATIENT_ID}:${STUDY_ID}`,
    uniqueSampleKey: `${sampleId}:${STUDY_ID}`,
    sequenced: true,
    copyNumberSegmentPresent: false,
}));

/**
 * The patient page around the foundation slide mocks: every other portal
 * API answers empty, the patient has two samples, and the clinical events
 * include PATHOLOGY SLIDES events.
 */
async function installPatientPageMocks(
    page: Page,
    accessRequests: string[],
    tileServerRequests: TileServerRequest[]
) {
    // Registered first, so the specific routes below take precedence.
    await page.route('**/api/**', route => {
        const pathname = new URL(route.request().url()).pathname;
        if (pathname === '/api/studies') {
            return route.fulfill(json([study]));
        }
        if (pathname === '/api/studies/fetch') {
            return route.fulfill(json([study]));
        }
        if (pathname === `/api/studies/${STUDY_ID}/patients/${PATIENT_ID}`) {
            return route.fulfill(
                json({
                    patientId: PATIENT_ID,
                    studyId: STUDY_ID,
                    uniquePatientKey: `${PATIENT_ID}:${STUDY_ID}`,
                })
            );
        }
        if (/\/samples(\/fetch)?$/.test(pathname)) {
            return route.fulfill(json(samples));
        }
        return route.fulfill(json([]));
    });
    await installFoundationMocks(page, {
        accessRequests,
        tileServerRequests,
        slideRows,
    });
    await page.route(
        new RegExp(
            `/api/studies/${STUDY_ID}/patients/${PATIENT_ID}/samples(\\?.*)?$`
        ),
        route => route.fulfill(json(samples))
    );
    await page.route(
        `**/api/studies/${STUDY_ID}/patients/${PATIENT_ID}/clinical-events**`,
        route => route.fulfill(json(clinicalEvents))
    );
}

/** The slide key each tile or thumbnail request names. */
function requestedSlideKeys(requests: TileServerRequest[]): string[] {
    return requests.map(
        request => new URL(request.url).searchParams.get('key') || ''
    );
}

/**
 * The tile server is asked only for the linked sample's slides, each named by
 * study, key and sealed source with no Authorization header (the session
 * cookie authorizes it). The other sample's slide is never requested.
 */
function expectTilesWithinLinkedSample(requests: TileServerRequest[]) {
    expect(requestedSlideKeys(requests)).not.toContain(LATER_KEY);
    for (const request of requests) {
        const url = new URL(request.url);
        const key = url.searchParams.get('key') || '';
        expect([HNE_KEY, IHC_KEY]).toContain(key);
        expect(url.searchParams.get('studyId')).toBe(STUDY_ID);
        expect(url.searchParams.get('enc')).toBe(sealedSourceFor(key));
        expect(request.headers.authorization).toBeUndefined();
    }
}

/** Asserts the Pathology Slides tab lists exactly `slideKeys`. */
async function expectListedSlides(page: Page, slideKeys: string[]) {
    // The count shows only while a filter narrows the list.
    await expect(page.getByTestId('wsi-filtered-slide-count')).toHaveText(
        `Showing ${slideKeys.length} of ${ALL_KEYS.length} slides`,
        {
            timeout: 30000,
        }
    );
    for (const key of ALL_KEYS) {
        await expect(page.getByTestId(`wsi-slide-item-${key}`)).toHaveCount(
            slideKeys.includes(key) ? 1 : 0
        );
    }
}

/**
 * Hovers the timeline events in turn until one shows a pathology slide
 * tooltip titled `title`, and returns that tooltip.
 */
async function hoverPathologyEvent(page: Page, title: string) {
    const events = page.locator(
        '.tl-timeline-svg g.tl-track g[style*="cursor"]'
    );
    await expect(events.first()).toBeVisible({ timeout: 30000 });
    // Any event's tooltip; other tracks (Sequencing) have their own.
    const anyTooltip = page.locator('.tl-timeline-tooltip');
    const tooltip = page.locator('[data-test="pathology-slide-tooltip"]');
    const count = await events.count();
    for (let i = 0; i < count; i++) {
        const box = await events.nth(i).boundingBox();
        if (!box) {
            continue;
        }
        await page.mouse.move(0, 0);
        await expect(anyTooltip).toHaveCount(0);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.move(
            box.x + box.width / 2 + 1,
            box.y + box.height / 2
        );
        await expect(anyTooltip).toHaveCount(1);
        if ((await tooltip.count()) === 0) {
            continue;
        }
        const text = (await tooltip.locator('strong').textContent()) || '';
        if (text === title) {
            return tooltip;
        }
    }
    throw new Error(`No timeline event shows a "${title}" tooltip`);
}

if (process.env.PW_SUITE === 'wsi') {
    test.describe('WSI patient timeline pathology slide links', () => {
        test('a timeline tooltip link opens the Pathology Slides tab scoped to its event', async ({
            page,
        }) => {
            const accessRequests: string[] = [];
            const tileServerRequests: TileServerRequest[] = [];
            await installPatientPageMocks(
                page,
                accessRequests,
                tileServerRequests
            );
            await page.goto(
                `/patient/summary?studyId=${STUDY_ID}&caseId=${PATIENT_ID}`
            );

            const tooltip = await hoverPathologyEvent(
                page,
                'Pathology slides · H&E · Block-matched'
            );
            await expect(tooltip).toContainText(SAMPLE_ID);
            await expect(tooltip).toContainText(
                '-10 days (d-10) — 10 days before sequencing (d0)'
            );
            await expect(tooltip).toContainText('Part 1 / Block A1');
            await expect(tooltip).toContainText(/Slides\s*1/);
            await expect(tooltip).not.toContainText('viewable');
            const link = tooltip.getByRole('link', {
                name: `Open slides (H&E, ${SAMPLE_ID})`,
            });
            // The link is the event's LINKOUT.
            expect(await link.getAttribute('href')).toBe(HNE_LINKOUT);
            // No slide is opened while the Summary tab is showing.
            expect(tileServerRequests).toEqual([]);

            // Enter the tooltip so it stays open, then follow the link.
            const linkBox = await link.boundingBox();
            await page.mouse.move(
                linkBox!.x + linkBox!.width / 2,
                linkBox!.y + linkBox!.height / 2
            );
            await link.click();

            await expect(page).toHaveURL(/\/patient\/wsiHESlides\?/);
            expect(new URL(page.url()).searchParams.get('sampleId')).toBe(
                SAMPLE_ID
            );
            await expectListedSlides(page, [HNE_KEY]);
            await expect(
                page.getByTestId(`wsi-slide-item-${HNE_KEY}`)
            ).toHaveAttribute('aria-current', 'true', { timeout: 30000 });
            await expect
                .poll(() => requestedSlideKeys(tileServerRequests), {
                    timeout: 30000,
                })
                .toContain(HNE_KEY);
            expectTilesWithinLinkedSample(tileServerRequests);
            // The retired slide access endpoint is never called.
            expect(accessRequests).toEqual([]);
        });

        test("a PART event's part key scopes the Pathology Slides tab to that part", async ({
            page,
        }) => {
            const accessRequests: string[] = [];
            const tileServerRequests: TileServerRequest[] = [];
            await installPatientPageMocks(
                page,
                accessRequests,
                tileServerRequests
            );
            await page.goto(
                `/patient/summary?studyId=${STUDY_ID}&caseId=${PATIENT_ID}`
            );

            const tooltip = await hoverPathologyEvent(
                page,
                'Pathology slides · H&E · Part-matched'
            );
            await expect(tooltip).toContainText(LATER_SAMPLE_ID);
            const link = tooltip.getByRole('link', {
                name: `Open slides (H&E, ${LATER_SAMPLE_ID})`,
            });
            expect(await link.getAttribute('href')).toBe(PART_LINKOUT);

            const linkBox = await link.boundingBox();
            await page.mouse.move(
                linkBox!.x + linkBox!.width / 2,
                linkBox!.y + linkBox!.height / 2
            );
            await link.click();

            await expect(page).toHaveURL(/\/patient\/wsiHESlides\?/);
            // Only part 2's slide: the sample's part 3 slide is left out.
            await expectListedSlides(page, [LATER_KEY]);
            await expect(
                page.getByTestId(`wsi-slide-item-${LATER_KEY}`)
            ).toHaveAttribute('aria-current', 'true', { timeout: 30000 });
            await expect
                .poll(() => requestedSlideKeys(tileServerRequests), {
                    timeout: 30000,
                })
                .toContain(LATER_KEY);
            expect(requestedSlideKeys(tileServerRequests)).not.toContain(
                OTHER_PART_KEY
            );
            expect(accessRequests).toEqual([]);
        });
    });
}

import { test, expect } from '../fixtures';
import {
    installFoundationMocks,
    STUDY_ID,
    PATIENT_ID,
    SAMPLE_ID,
    SLIDE_KEY,
} from './wsi-foundation-mocks';

type Page = import('@playwright/test').Page;

/** A study with mutation, copy-number (discrete and log2) and SV profiles. */
const MOLECULAR_PROFILES = [
    {
        molecularProfileId: `${STUDY_ID}_log2CNA`,
        molecularAlterationType: 'COPY_NUMBER_ALTERATION',
        datatype: 'LOG2-VALUE',
        study: { studyId: STUDY_ID, referenceGenome: 'hg19' },
    },
    {
        molecularProfileId: `${STUDY_ID}_mutations`,
        molecularAlterationType: 'MUTATION_EXTENDED',
        datatype: 'MAF',
    },
    {
        molecularProfileId: `${STUDY_ID}_gistic`,
        molecularAlterationType: 'COPY_NUMBER_ALTERATION',
        datatype: 'DISCRETE',
    },
    {
        molecularProfileId: `${STUDY_ID}_structural_variants`,
        molecularAlterationType: 'STRUCTURAL_VARIANT',
        datatype: 'SV',
    },
];

function json(body: unknown) {
    return {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
    };
}

/** The portal molecular requests the viewer makes, with the study mocks. */
async function installMolecularMocks(
    page: Page,
    profiles: Array<Record<string, unknown>>,
    options: { annotations?: boolean } = {}
) {
    const accessRequests: string[] = [];
    const enrichmentRequests = await installFoundationMocks(page, {
        accessRequests,
    });
    const portalRequests: string[] = [];
    const annotationRequests: Array<{ url: string; postData?: string }> = [];
    page.on('request', request => {
        const url = request.url();
        if (
            /\/api\/(studies\/[^/]+\/molecular-profiles|mutations\/fetch|molecular-profiles\/|structural-variant|cna-genes|mutation-counts-by-position|clinical-data\/fetch)/.test(
                url
            ) ||
            new RegExp(`/api/studies/${STUDY_ID}(\\?|$)`).test(url)
        ) {
            portalRequests.push(url);
        }
        if (/\/proxy\/|oncokb|civicdb|civic/i.test(url)) {
            enrichmentRequests.push(url);
            annotationRequests.push({
                url,
                postData: request.postData() || undefined,
            });
        }
    });

    // The portal enables OncoKB by default; these tests set both services.
    await page.route('**/config_service', route =>
        route.fulfill(
            json({
                app_name: 'wsi-molecular-smoke',
                authenticationMethod: 'none',
                wsi_tile_server_url: '/wsi',
                show_oncokb: !!options.annotations,
                show_civic: !!options.annotations,
            })
        )
    );
    if (options.annotations) {
        // Every OncoKB request through the portal proxy gets this answer.
        await page.route('**/proxy/**', route =>
            route.fulfill(
                json([
                    {
                        query: { id: '3845_G12D_Missense_Mutation_LUAD' },
                        oncogenic: 'Oncogenic',
                        geneSummary: 'KRAS summary',
                    },
                ])
            )
        );
        await page.route('**civicdb.org/api/graphql', route =>
            route.fulfill(
                json({
                    data: {
                        genes: {
                            pageInfo: {
                                endCursor: null,
                                hasNextPage: false,
                                startCursor: null,
                                hasPreviousPage: false,
                            },
                            nodes: [],
                        },
                    },
                })
            )
        );
    }
    // The sample's OncoTree code, OncoKB's tumor type.
    await page.route('**/api/clinical-data/fetch**', route =>
        route.fulfill(
            json([
                {
                    clinicalAttributeId: 'ONCOTREE_CODE',
                    value: 'LUAD',
                    patientId: PATIENT_ID,
                    sampleId: SAMPLE_ID,
                    studyId: STUDY_ID,
                },
            ])
        )
    );

    await page.route(`**/api/studies/${STUDY_ID}/molecular-profiles**`, route =>
        route.fulfill(json(profiles))
    );
    await page.route('**/api/mutations/fetch**', route =>
        route.fulfill(
            json([
                {
                    sampleId: SAMPLE_ID,
                    entrezGeneId: 3845,
                    gene: { hugoGeneSymbol: 'KRAS', entrezGeneId: 3845 },
                    proteinChange: 'G12D',
                    mutationType: 'Missense_Mutation',
                    keyword: 'KRAS G12 missense',
                    tumorAltCount: 30,
                    tumorRefCount: 70,
                },
            ])
        )
    );
    await page.route(
        '**/api/molecular-profiles/*/molecular-data/fetch**',
        route =>
            route.fulfill(
                json([
                    {
                        sampleId: SAMPLE_ID,
                        value: 2,
                        gene: { hugoGeneSymbol: 'ERBB2', entrezGeneId: 2064 },
                    },
                    {
                        sampleId: SAMPLE_ID,
                        value: 0,
                        gene: { hugoGeneSymbol: 'TP53', entrezGeneId: 7157 },
                    },
                ])
            )
    );
    await page.route(
        '**/api/molecular-profiles/*/discrete-copy-number-counts/fetch',
        route =>
            route.fulfill(
                json([
                    {
                        entrezGeneId: 2064,
                        alteration: 2,
                        numberOfSamples: 200,
                        numberOfSamplesWithAlterationInGene: 10,
                    },
                ])
            )
    );
    await page.route('**/api/structural-variant/fetch**', route =>
        route.fulfill(
            json([
                {
                    sampleId: SAMPLE_ID,
                    site1HugoSymbol: 'EML4',
                    site2HugoSymbol: 'ALK',
                    variantClass: 'FUSION',
                },
            ])
        )
    );
    await page.route(
        '**/api/molecular-profiles/*/variant-counts/fetch',
        route =>
            route.fulfill(
                json([
                    {
                        entrezGeneId: 3845,
                        keyword: 'KRAS G12 missense',
                        numberOfSamples: 120,
                        numberOfSamplesWithKeyword: 3,
                    },
                ])
            )
    );
    return {
        accessRequests,
        annotationRequests,
        enrichmentRequests,
        portalRequests,
    };
}

async function openViewer(page: Page) {
    await page.goto(
        `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}#wsi:slide=${SLIDE_KEY}`
    );
    await expect(page.getByTitle('Fit to view')).toBeVisible({
        timeout: 30000,
    });
}

test.describe('WSI viewer molecular data', () => {
    test('loads the molecular tables from the study profiles without changing tile routing', async ({
        page,
    }) => {
        const {
            accessRequests,
            enrichmentRequests,
            portalRequests,
        } = await installMolecularMocks(page, MOLECULAR_PROFILES);
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));

        await openViewer(page);

        const molecular = page.getByTestId('wsi-sidebar-section-molecular');
        await expect(molecular).toContainText('KRAS', { timeout: 30000 });
        await expect(molecular).toContainText('G12D');
        await expect(molecular).toContainText('ERBB2');
        await expect(molecular).toContainText('AMP');
        await expect(molecular).toContainText('EML4');
        await expect(molecular).not.toContainText('TP53');
        // The study counts arrive last, in the variant's details.
        await expect(molecular.getByText('G12D')).toContainText(
            'Samples in study with this variant: 3/120 (2.5%)'
        );

        const requested = (fragment: string) =>
            portalRequests.filter(url => url.includes(fragment));
        // One profile list, with no type filter, for all three tables.
        expect(requested('/molecular-profiles?')).toHaveLength(1);
        expect(requested('molecularAlterationType')).toEqual([]);
        expect(requested('/molecular-data/fetch')).toEqual([
            expect.stringContaining(
                `/api/molecular-profiles/${STUDY_ID}_gistic/molecular-data/fetch`
            ),
        ]);
        expect(
            requested(
                `/api/molecular-profiles/${STUDY_ID}_mutations/variant-counts/fetch`
            )
        ).toHaveLength(1);
        // No study-wide aggregations and no second study request.
        expect(requested('/cna-genes')).toEqual([]);
        expect(requested('/mutation-counts-by-position')).toEqual([]);
        expect(
            portalRequests.filter(url =>
                new RegExp(`/api/studies/${STUDY_ID}(\\?|$)`).test(url)
            )
        ).toEqual([]);
        // The viewer reads the sample attributes from the page's clinical data.
        expect(requested('/clinical-data/fetch')).toHaveLength(1);
        // OncoKB and CIViC are off: no request, no link, no icon.
        expect(enrichmentRequests).toEqual([]);
        await expect(molecular.locator('a[href*="oncokb.org"]')).toHaveCount(0);
        await expect(
            molecular.locator('[data-test="oncogenic-icon-image"]')
        ).toHaveCount(0);
        await expect(molecular).not.toContainText('Annot');
        // Tiles are served from the resource row: no slide access request.
        expect(accessRequests).toEqual([]);
        expect(errors).toEqual([]);
    });

    test('shows a study without molecular profiles as not profiled', async ({
        page,
    }) => {
        const { portalRequests } = await installMolecularMocks(page, []);
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));

        await openViewer(page);

        await expect(
            page.getByTestId('wsi-mutation-table-unprofiled')
        ).toHaveText('Not profiled for mutations.', { timeout: 30000 });
        expect(
            portalRequests.filter(url =>
                /mutations\/fetch|molecular-data|structural-variant|variant-counts/.test(
                    url
                )
            )
        ).toEqual([]);
        expect(
            portalRequests.filter(url => url.includes('/molecular-profiles?'))
        ).toHaveLength(1);
        expect(errors).toEqual([]);
    });

    test('annotates through the portal OncoKB proxy for the sample tumor type', async ({
        page,
    }) => {
        const { annotationRequests } = await installMolecularMocks(
            page,
            MOLECULAR_PROFILES,
            { annotations: true }
        );
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));

        await openViewer(page);

        const molecular = page.getByTestId('wsi-sidebar-section-molecular');
        const link = molecular.getByRole('link', {
            name: 'OncoKB: Oncogenic for KRAS G12D (opens in a new tab)',
        });
        await expect(link).toHaveAttribute(
            'href',
            'https://www.oncokb.org/gene/KRAS/G12D',
            { timeout: 30000 }
        );

        // The portal proxy carries the OncoKB path and body base64-encoded.
        const decode = (value: string) =>
            Buffer.from(value, 'base64').toString('utf8');
        const mutationRequest = annotationRequests.find(
            request =>
                request.url.includes('/proxy/') &&
                decode(request.url.split('/').pop() || '').includes(
                    '/annotate/mutations/byProteinChange'
                )
        );
        expect(mutationRequest?.postData).toBeTruthy();
        expect(JSON.parse(decode(mutationRequest!.postData!))).toEqual([
            expect.objectContaining({
                id: '3845_G12D_Missense_Mutation_LUAD',
                alteration: 'G12D',
                tumorType: 'LUAD',
                referenceGenome: 'GRCh37',
            }),
        ]);
        expect(
            annotationRequests.some(request =>
                request.url.includes('civicdb.org')
            )
        ).toBe(true);
        expect(errors).toEqual([]);
    });
});

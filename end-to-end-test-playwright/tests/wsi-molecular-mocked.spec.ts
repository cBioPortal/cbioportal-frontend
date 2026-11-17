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
    profiles: typeof MOLECULAR_PROFILES
) {
    const accessRequests: string[] = [];
    const enrichmentRequests = await installFoundationMocks(page, {
        accessRequests,
    });
    const portalRequests: string[] = [];
    const copyNumberCountQueries: unknown[] = [];
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
        }
    });

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
    // Only amplifications and deep deletions, as the viewer requests them.
    await page.route(
        '**/api/molecular-profiles/*/discrete-copy-number/fetch**',
        route =>
            route.fulfill(
                json([
                    {
                        sampleId: SAMPLE_ID,
                        alteration: 2,
                        entrezGeneId: 2064,
                        gene: { hugoGeneSymbol: 'ERBB2', entrezGeneId: 2064 },
                    },
                ])
            )
    );
    await page.route(
        '**/api/molecular-profiles/*/discrete-copy-number-counts/fetch',
        route => {
            copyNumberCountQueries.push(route.request().postDataJSON());
            return route.fulfill(
                json([
                    {
                        entrezGeneId: 2064,
                        alteration: 2,
                        numberOfSamples: 200,
                        numberOfSamplesWithAlterationInGene: 10,
                    },
                ])
            );
        }
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
        enrichmentRequests,
        portalRequests,
        copyNumberCountQueries,
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

// The WSI suite (PW_SUITE=wsi) runs this spec against a static build. On the
// public portal used by the remote e2e jobs the route shows an error page.
if (process.env.PW_SUITE === 'wsi') {
    test.describe('WSI viewer molecular data', () => {
        test('loads the molecular tables from the study profiles without changing tile routing', async ({
            page,
        }) => {
            const {
                accessRequests,
                enrichmentRequests,
                portalRequests,
                copyNumberCountQueries,
            } = await installMolecularMocks(page, MOLECULAR_PROFILES);
            const errors: string[] = [];
            page.on('pageerror', error => errors.push(error.message));

            await openViewer(page);

            const molecular = page.getByTestId('wsi-sidebar-section-molecular');
            await expect(molecular).toContainText('KRAS', { timeout: 30000 });
            await expect(molecular).toContainText('G12D');
            await expect(molecular).toContainText('ERBB2');
            await expect(molecular).toContainText('AMP');
            await expect(molecular).toContainText(
                'Samples in study with this alteration: 10/200 (5.0%)'
            );
            await expect(molecular).toContainText('EML4');
            // The study counts arrive last, in the variant's details.
            await expect(molecular.getByText('G12D')).toContainText(
                'Samples in study with this variant: 3/120 (2.5%)'
            );

            const requested = (fragment: string) =>
                portalRequests.filter(url => url.includes(fragment));
            // One profile list, with no type filter, for all three tables.
            expect(requested('/molecular-profiles?')).toHaveLength(1);
            expect(requested('molecularAlterationType')).toEqual([]);
            expect(requested('/discrete-copy-number/fetch')).toEqual([
                expect.stringContaining(
                    `/api/molecular-profiles/${STUDY_ID}_gistic/discrete-copy-number/fetch?discreteCopyNumberEventType=HOMDEL_AND_AMP`
                ),
            ]);
            expect(requested('/molecular-data/fetch')).toEqual([]);
            // Study counts only for the sample's alterations.
            expect(copyNumberCountQueries).toEqual([
                [{ entrezGeneId: 2064, alteration: 2 }],
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
            expect(enrichmentRequests).toEqual([]);
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
                    /mutations\/fetch|discrete-copy-number|structural-variant|variant-counts/.test(
                        url
                    )
                )
            ).toEqual([]);
            expect(
                portalRequests.filter(url =>
                    url.includes('/molecular-profiles?')
                )
            ).toHaveLength(1);
            expect(errors).toEqual([]);
        });
    });
}

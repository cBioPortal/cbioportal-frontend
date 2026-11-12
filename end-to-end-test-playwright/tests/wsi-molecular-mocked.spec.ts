import { test, expect } from '../fixtures';
import {
    installFoundationMocks,
    STUDY_ID,
    PATIENT_ID,
    SLIDE_KEY,
} from './wsi-foundation-mocks';

const SAMPLE_ID = 'wsi-foundation-smoke-sample';

async function installMolecularMocks(
    page: import('@playwright/test').Page,
    options: { enrichment?: boolean } = {}
) {
    const accessRequests: string[] = [];
    const enrichmentRequests = await installFoundationMocks(page, {
        accessRequests,
    });
    const portalRequests: string[] = [];
    const enrichmentDetails: Array<{ url: string; postData?: string }> = [];
    page.on('request', request => {
        if (
            /molecular-profiles|mutations\/fetch|cna-genes|structural-variant|mutation-counts/.test(
                request.url()
            )
        ) {
            portalRequests.push(request.url());
        }
        if (/\/proxy\/|oncokb|civicdb|civic/i.test(request.url())) {
            enrichmentRequests.push(request.url());
            enrichmentDetails.push({
                url: request.url(),
                postData: request.postData() || undefined,
            });
        }
    });

    await page.route('**/config_service', route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                app_name: 'wsi-molecular-smoke',
                authenticationMethod: 'none',
                wsi_tile_server_url: '/wsi',
                show_oncokb: options.enrichment === true,
                show_civic: options.enrichment === true,
            }),
        })
    );
    if (options.enrichment) {
        await page.route('**/proxy/**', route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        query: { id: '3845_G12D_Missense_Mutation' },
                        oncogenic: 'Oncogenic',
                    },
                ]),
            })
        );
        await page.route('**civicdb.org/api/graphql', route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    data: {
                        genes: {
                            pageInfo: {
                                endCursor: null,
                                hasNextPage: false,
                                startCursor: null,
                                hasPreviousPage: false,
                            },
                            nodes: [
                                {
                                    id: 3845,
                                    name: 'KRAS',
                                    link: '/genes/3845',
                                    description: 'KRAS CIViC summary',
                                    variants: {
                                        pageInfo: {
                                            endCursor: null,
                                            hasNextPage: false,
                                            startCursor: null,
                                            hasPreviousPage: false,
                                        },
                                        nodes: [],
                                    },
                                },
                            ],
                        },
                    },
                }),
            })
        );
    }
    await page.route(`**/api/studies/${STUDY_ID}/samples**`, route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    sampleId: SAMPLE_ID,
                    patientId: PATIENT_ID,
                    studyId: STUDY_ID,
                    sequenced: true,
                },
            ]),
        })
    );
    await page.route(`**/api/studies/${STUDY_ID}/molecular-profiles**`, route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    molecularProfileId: 'wsi-mutations',
                    molecularAlterationType: 'MUTATION_EXTENDED',
                },
            ]),
        })
    );
    await page.route('**/api/mutations/fetch**', route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    sampleId: SAMPLE_ID,
                    entrezGeneId: 3845,
                    gene: { hugoGeneSymbol: 'KRAS', entrezGeneId: 3845 },
                    proteinChange: 'p.G12D',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 12,
                    proteinPosEnd: 12,
                },
            ]),
        })
    );
    await page.route('**/api/mutation-counts-by-position/fetch', route =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        })
    );
    return {
        accessRequests,
        enrichmentRequests,
        enrichmentDetails,
        portalRequests,
    };
}

test.describe('WSI viewer molecular data', () => {
    test('loads molecular rows through portal APIs without changing tile routing', async ({
        page,
    }) => {
        const {
            accessRequests,
            enrichmentRequests,
            portalRequests,
        } = await installMolecularMocks(page);
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));

        await page.goto(
            `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}#wsi:slide=${SLIDE_KEY}`
        );

        await expect(page.getByTitle('Fit to view')).toBeVisible({
            timeout: 30000,
        });
        await expect(
            page.getByTestId('wsi-metadata-sidebar')
        ).toContainText('KRAS', { timeout: 30000 });
        expect(
            portalRequests.some(url => url.includes('/api/mutations/fetch'))
        ).toBe(true);
        expect(enrichmentRequests).toEqual([]);
        // Tiles are served from the resource row: no slide access request.
        expect(accessRequests).toEqual([]);
        expect(errors).toEqual([]);
    });

    test('uses enabled enrichment through the portal proxy without breaking viewing', async ({
        page,
    }) => {
        const {
            enrichmentRequests,
            enrichmentDetails,
            portalRequests,
        } = await installMolecularMocks(page, { enrichment: true });
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));

        await page.goto(
            `/wsi/patient/${PATIENT_ID}?studyId=${STUDY_ID}#wsi:slide=${SLIDE_KEY}`
        );

        await expect(page.getByTitle('Fit to view')).toBeVisible({
            timeout: 30000,
        });
        await expect(
            page.getByTestId('wsi-metadata-sidebar')
        ).toContainText('KRAS', { timeout: 30000 });
        await expect
            .poll(() => enrichmentRequests.length, { timeout: 30000 })
            .toBeGreaterThan(0);

        expect(
            enrichmentDetails.some(detail => {
                const pathPart = detail.url.split('/').pop() || '';
                try {
                    return Buffer.from(pathPart, 'base64')
                        .toString('utf8')
                        .includes('/annotate/mutations/byProteinChange');
                } catch (_) {
                    return false;
                }
            })
        ).toBe(true);
        const mutationRequest = enrichmentDetails.find(detail =>
            detail.url.includes('/proxy/')
        );
        expect(mutationRequest?.postData).toBeTruthy();
        const mutationBody = JSON.parse(
            Buffer.from(String(mutationRequest?.postData), 'base64').toString(
                'utf8'
            )
        );
        expect(mutationBody).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: '3845_G12D_Missense_Mutation',
                    alteration: 'G12D',
                }),
            ])
        );
        expect(
            portalRequests.some(url => url.includes('/api/mutations/fetch'))
        ).toBe(true);
        expect(errors).toEqual([]);
    });
});

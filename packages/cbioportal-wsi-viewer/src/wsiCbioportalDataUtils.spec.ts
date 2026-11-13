/**
 * @jest-environment jsdom
 */
import {
    clearWsiCbioportalRequestCaches,
    fetchClinicalDataRecords,
    fetchCnaData,
    fetchMutationData,
    fetchStructuralVariantData,
    fetchStudyMolecularProfiles,
    fetchVariantCounts,
    selectStudyMolecularProfiles,
    variantCountKey,
    WsiMolecularProfileRecord,
} from './wsiCbioportalDataUtils';
import { MutationDetail } from './wsiViewerTypes';
import {
    configureWsiViewerRuntime,
    resetWsiViewerRuntime,
} from './wsiViewerConfig';

const MUTATION_PROFILE: WsiMolecularProfileRecord = {
    molecularProfileId: 'study_mutations',
    molecularAlterationType: 'MUTATION_EXTENDED',
    datatype: 'MAF',
};
const LOG2_CNA_PROFILE: WsiMolecularProfileRecord = {
    molecularProfileId: 'study_log2CNA',
    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
    datatype: 'LOG2-VALUE',
};
const DISCRETE_CNA_PROFILE: WsiMolecularProfileRecord = {
    molecularProfileId: 'study_gistic',
    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
    datatype: 'DISCRETE',
};
const SV_PROFILE: WsiMolecularProfileRecord = {
    molecularProfileId: 'study_structural_variants',
    molecularAlterationType: 'STRUCTURAL_VARIANT',
    datatype: 'SV',
};
const EXPRESSION_PROFILE: WsiMolecularProfileRecord = {
    molecularProfileId: 'study_mrna',
    molecularAlterationType: 'MRNA_EXPRESSION',
    datatype: 'CONTINUOUS',
};

type Route = {
    match: string;
    respond: (body: any) => { status?: number; json: unknown };
};

/** A fetch that answers by URL fragment and records each request. */
function installFetch(routes: Route[]) {
    const calls: Array<{ url: string; body: any }> = [];
    const fetchImpl = jest.fn(async (url: string, init?: RequestInit) => {
        const body = init?.body ? JSON.parse(String(init.body)) : undefined;
        calls.push({ url, body });
        const route = routes.find(candidate => url.includes(candidate.match));
        if (!route) {
            throw new Error(`unexpected request ${url}`);
        }
        const { status = 200, json } = route.respond(body);
        return {
            ok: status >= 200 && status < 300,
            status,
            json: () => Promise.resolve(json),
        } as Response;
    });
    configureWsiViewerRuntime({
        buildApiUrl: (path: string) => `/${path}`,
        fetchImpl: (fetchImpl as unknown) as typeof fetch,
    });
    return {
        calls,
        urls: () => calls.map(call => call.url),
        count: (fragment: string) =>
            calls.filter(call => call.url.includes(fragment)).length,
    };
}

function profilesRoute(profiles: WsiMolecularProfileRecord[]): Route {
    return {
        match: '/molecular-profiles?',
        respond: () => ({ json: profiles }),
    };
}

const samples = [
    { studyId: 'study', sampleId: 'S-2' },
    { studyId: 'study', sampleId: 'S-1' },
];

beforeEach(() => {
    clearWsiCbioportalRequestCaches();
});

afterEach(() => {
    clearWsiCbioportalRequestCaches();
    resetWsiViewerRuntime();
});

describe('selectStudyMolecularProfiles', () => {
    it('selects the mutation profile of a mutation-only study', () => {
        expect(
            selectStudyMolecularProfiles([EXPRESSION_PROFILE, MUTATION_PROFILE])
        ).toEqual({
            mutation: 'study_mutations',
            discreteCna: null,
            structuralVariant: null,
            referenceGenome: null,
        });
    });

    it('selects the discrete copy-number profile, not the log2 one', () => {
        expect(
            selectStudyMolecularProfiles([
                LOG2_CNA_PROFILE,
                DISCRETE_CNA_PROFILE,
            ]).discreteCna
        ).toBe('study_gistic');
        expect(
            selectStudyMolecularProfiles([LOG2_CNA_PROFILE]).discreteCna
        ).toBeNull();
    });

    it('selects the structural variant profile', () => {
        expect(
            selectStudyMolecularProfiles([MUTATION_PROFILE, SV_PROFILE])
                .structuralVariant
        ).toBe('study_structural_variants');
    });

    it('selects nothing for a study without molecular profiles', () => {
        expect(selectStudyMolecularProfiles([EXPRESSION_PROFILE])).toEqual({
            mutation: null,
            discreteCna: null,
            structuralVariant: null,
            referenceGenome: null,
        });
        expect(selectStudyMolecularProfiles([])).toEqual({
            mutation: null,
            discreteCna: null,
            structuralVariant: null,
            referenceGenome: null,
        });
    });

    it("reads the study's reference genome", () => {
        expect(
            selectStudyMolecularProfiles([
                { ...MUTATION_PROFILE, study: { referenceGenome: 'hg38' } },
            ]).referenceGenome
        ).toBe('hg38');
    });
});

describe('fetchStudyMolecularProfiles', () => {
    it('requests the study profile list once, without a type filter', async () => {
        const fetch = installFetch([
            profilesRoute([MUTATION_PROFILE, DISCRETE_CNA_PROFILE]),
        ]);

        await Promise.all([
            fetchStudyMolecularProfiles('study'),
            fetchStudyMolecularProfiles('study'),
        ]);
        await fetchStudyMolecularProfiles('study');

        expect(fetch.urls()).toEqual([
            '/api/studies/study/molecular-profiles?projection=DETAILED',
        ]);
    });

    it('rejects a failed request and asks again on the next call', async () => {
        let status = 503;
        const fetch = installFetch([
            {
                match: '/molecular-profiles?',
                respond: () => ({ status, json: [MUTATION_PROFILE] }),
            },
        ]);

        await expect(fetchStudyMolecularProfiles('study')).rejects.toThrow(
            '503'
        );
        status = 200;
        await expect(fetchStudyMolecularProfiles('study')).resolves.toEqual(
            expect.objectContaining({ mutation: 'study_mutations' })
        );
        expect(fetch.count('/molecular-profiles?')).toBe(2);
    });
});

describe('fetchClinicalDataRecords', () => {
    it('requests the host portal API URLs through the host fetch', async () => {
        const fetchImpl = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve([]),
        });
        configureWsiViewerRuntime({
            buildApiUrl: (path: string) =>
                `https://portal.example/beta/${path}`,
            fetchImpl: fetchImpl as typeof fetch,
        });

        await fetchClinicalDataRecords([
            { studyId: 'study-1', sampleId: 'S-1' },
        ]);

        expect(fetchImpl).toHaveBeenCalledWith(
            'https://portal.example/beta/api/clinical-data/fetch?clinicalDataType=SAMPLE&projection=SUMMARY',
            expect.objectContaining({ method: 'POST' })
        );
    });

    it('requests a sample set once, deduplicated and in canonical order', async () => {
        const fetch = installFetch([
            {
                match: '/clinical-data/fetch',
                respond: () => ({ json: [] }),
            },
        ]);

        await fetchClinicalDataRecords([...samples, samples[0]]);
        await fetchClinicalDataRecords([samples[1], samples[0]]);

        expect(fetch.calls).toHaveLength(1);
        expect(fetch.calls[0].body).toEqual({
            identifiers: [
                { studyId: 'study', entityId: 'S-1' },
                { studyId: 'study', entityId: 'S-2' },
            ],
        });
    });

    it('makes no request without samples', async () => {
        const fetch = installFetch([]);
        await expect(fetchClinicalDataRecords([])).resolves.toEqual([]);
        expect(fetch.calls).toHaveLength(0);
    });

    it('resolves a failure to null without caching it', async () => {
        let status = 500;
        const fetch = installFetch([
            {
                match: '/clinical-data/fetch',
                respond: () => ({ status, json: [] }),
            },
        ]);

        await expect(fetchClinicalDataRecords(samples)).resolves.toBeNull();
        status = 200;
        await expect(fetchClinicalDataRecords(samples)).resolves.toEqual([]);
        expect(fetch.calls).toHaveLength(2);
    });
});

describe('fetchMutationData', () => {
    it('makes no mutation request when the study has no mutation profile', async () => {
        const fetch = installFetch([profilesRoute([DISCRETE_CNA_PROFILE])]);

        const data = await fetchMutationData('study', samples);

        expect(data.profileId).toBeNull();
        expect(data.bySample.size).toBe(0);
        expect(fetch.count('/mutations/fetch')).toBe(0);
    });

    it('fetches the samples from the mutation profile', async () => {
        const fetch = installFetch([
            profilesRoute([LOG2_CNA_PROFILE, MUTATION_PROFILE]),
            {
                match: '/mutations/fetch',
                respond: () => ({
                    json: [
                        {
                            sampleId: 'S-1',
                            gene: {
                                hugoGeneSymbol: 'KRAS',
                                entrezGeneId: 3845,
                            },
                            proteinChange: 'G12D',
                            mutationType: 'Missense_Mutation',
                            keyword: 'KRAS G12 missense',
                            tumorAltCount: 30,
                            tumorRefCount: 70,
                        },
                    ],
                }),
            },
        ]);

        const data = await fetchMutationData('study', samples);
        await fetchMutationData('study', [samples[1], samples[0]]);

        expect(fetch.count('/mutations/fetch')).toBe(1);
        expect(
            fetch.calls.find(call => call.url.includes('/mutations/fetch'))!
                .body
        ).toEqual({
            sampleMolecularIdentifiers: [
                { molecularProfileId: 'study_mutations', sampleId: 'S-1' },
                { molecularProfileId: 'study_mutations', sampleId: 'S-2' },
            ],
        });
        expect(data.profileId).toBe('study_mutations');
        expect(data.bySample.get('S-1')).toEqual([
            expect.objectContaining({
                token: 'KRAS G12D',
                gene: 'KRAS',
                proteinChange: 'G12D',
                vaf: 30,
                keyword: 'KRAS G12 missense',
            }),
        ]);
    });

    it('rejects a failed mutation request without caching it', async () => {
        let status = 500;
        const fetch = installFetch([
            profilesRoute([MUTATION_PROFILE]),
            {
                match: '/mutations/fetch',
                respond: () => ({ status, json: [] }),
            },
        ]);

        await expect(fetchMutationData('study', samples)).rejects.toThrow(
            '500'
        );
        status = 200;
        await expect(fetchMutationData('study', samples)).resolves.toEqual(
            expect.objectContaining({ profileId: 'study_mutations' })
        );
        expect(fetch.count('/mutations/fetch')).toBe(2);
        expect(fetch.count('/molecular-profiles?')).toBe(1);
    });
});

describe('fetchCnaData', () => {
    function cnaRoutes(values: Array<[string, string, number, number]>) {
        return [
            profilesRoute([
                MUTATION_PROFILE,
                LOG2_CNA_PROFILE,
                DISCRETE_CNA_PROFILE,
            ]),
            {
                match: '/molecular-data/fetch',
                respond: (body: { sampleIds: string[] }) => ({
                    json: values
                        .filter(([sampleId]) =>
                            body.sampleIds.includes(sampleId)
                        )
                        .map(
                            ([
                                sampleId,
                                hugoGeneSymbol,
                                entrezGeneId,
                                value,
                            ]) => ({
                                sampleId,
                                value,
                                gene: { hugoGeneSymbol, entrezGeneId },
                            })
                        ),
                }),
            },
            {
                match: '/discrete-copy-number-counts/fetch',
                respond: (body: any[]) => ({
                    json: body.map(query => ({
                        ...query,
                        numberOfSamples: 200,
                        numberOfSamplesWithAlterationInGene: 10,
                    })),
                }),
            },
        ];
    }

    it('makes no request when the study has only a log2 copy-number profile', async () => {
        const fetch = installFetch([
            profilesRoute([MUTATION_PROFILE, LOG2_CNA_PROFILE]),
        ]);

        await expect(fetchCnaData('study', samples)).resolves.toBeNull();
        expect(fetch.urls()).toEqual([
            '/api/studies/study/molecular-profiles?projection=DETAILED',
        ]);
    });

    it('counts only the altered genes, in the discrete profile', async () => {
        const fetch = installFetch(
            cnaRoutes([
                ['S-1', 'ERBB2', 2064, 2],
                ['S-1', 'TP53', 7157, 0],
                ['S-2', 'CDKN2A', 1029, -2],
            ])
        );

        const bySample = await fetchCnaData('study', samples);

        expect(
            fetch.calls.find(call => call.url.includes('/molecular-data/fetch'))
        ).toEqual({
            url:
                '/api/molecular-profiles/study_gistic/molecular-data/fetch?projection=DETAILED',
            body: { sampleIds: ['S-1', 'S-2'] },
        });
        const counts = fetch.calls.find(call =>
            call.url.includes('/discrete-copy-number-counts/fetch')
        )!;
        expect(counts.url).toBe(
            '/api/molecular-profiles/study_gistic/discrete-copy-number-counts/fetch'
        );
        expect(counts.body).toEqual([
            { entrezGeneId: 2064, alteration: 2 },
            { entrezGeneId: 1029, alteration: -2 },
        ]);
        expect(bySample!.get('S-1')).toEqual([
            {
                gene: 'ERBB2',
                entrezGeneId: 2064,
                cnaValue: 2,
                cohortAlteredCount: 10,
                cohortProfiledCount: 200,
            },
        ]);
    });

    it('skips the counts when the samples have no alterations', async () => {
        const fetch = installFetch(cnaRoutes([['S-1', 'TP53', 7157, 0]]));

        const bySample = await fetchCnaData('study', samples);

        expect(bySample!.size).toBe(0);
        expect(fetch.count('/discrete-copy-number-counts/fetch')).toBe(0);
    });

    it('caches the counts per gene and alteration', async () => {
        const fetch = installFetch(
            cnaRoutes([
                ['S-1', 'ERBB2', 2064, 2],
                ['S-2', 'CDKN2A', 1029, -2],
            ])
        );

        await fetchCnaData('study', [samples[1]]);
        await fetchCnaData('study', samples);

        const countBodies = fetch.calls
            .filter(call =>
                call.url.includes('/discrete-copy-number-counts/fetch')
            )
            .map(call => call.body);
        expect(countBodies).toEqual([
            [{ entrezGeneId: 2064, alteration: 2 }],
            [{ entrezGeneId: 1029, alteration: -2 }],
        ]);
    });

    it('keeps the alterations when the counts fail', async () => {
        const routes = cnaRoutes([['S-1', 'ERBB2', 2064, 2]]);
        routes[2] = {
            match: '/discrete-copy-number-counts/fetch',
            respond: () => ({ status: 500, json: [] }),
        };
        installFetch(routes);

        const bySample = await fetchCnaData('study', samples);

        expect(bySample!.get('S-1')).toEqual([
            expect.objectContaining({
                gene: 'ERBB2',
                cohortAlteredCount: undefined,
            }),
        ]);
    });
});

describe('fetchStructuralVariantData', () => {
    it('makes no request when the study has no structural variant profile', async () => {
        const fetch = installFetch([profilesRoute([MUTATION_PROFILE])]);

        await expect(
            fetchStructuralVariantData('study', samples)
        ).resolves.toBeNull();
        expect(fetch.count('/structural-variant/fetch')).toBe(0);
    });

    it('fetches the samples from the structural variant profile', async () => {
        const fetch = installFetch([
            profilesRoute([MUTATION_PROFILE, SV_PROFILE]),
            {
                match: '/structural-variant/fetch',
                respond: () => ({
                    json: [
                        {
                            sampleId: 'S-1',
                            site1HugoSymbol: 'EML4',
                            site2HugoSymbol: 'ALK',
                            variantClass: 'FUSION',
                        },
                    ],
                }),
            },
        ]);

        const bySample = await fetchStructuralVariantData('study', samples);

        expect(
            fetch.calls.find(call =>
                call.url.includes('/structural-variant/fetch')
            )!.body
        ).toEqual({
            sampleMolecularIdentifiers: [
                {
                    molecularProfileId: 'study_structural_variants',
                    sampleId: 'S-1',
                },
                {
                    molecularProfileId: 'study_structural_variants',
                    sampleId: 'S-2',
                },
            ],
        });
        expect(bySample!.get('S-1')).toEqual([
            expect.objectContaining({
                gene1: 'EML4',
                gene2: 'ALK',
                variantClass: 'FUSION',
            }),
        ]);
    });
});

describe('fetchVariantCounts', () => {
    const mutation = (
        gene: string,
        entrezGeneId: number,
        keyword?: string
    ): MutationDetail => ({
        token: `${gene} X`,
        gene,
        proteinChange: 'X',
        entrezGeneId,
        keyword,
    });

    it('requests the profile variant counts once per variant', async () => {
        const fetch = installFetch([
            {
                match: '/variant-counts/fetch',
                respond: (body: any[]) => ({
                    json: body.map(query => ({
                        ...query,
                        numberOfSamples: 120,
                        numberOfSamplesWithKeyword: 3,
                    })),
                }),
            },
        ]);

        const counts = await fetchVariantCounts('study_mutations', [
            mutation('KRAS', 3845, 'KRAS G12 missense'),
            mutation('KRAS', 3845, 'KRAS G12 missense'),
            mutation('TERT', 7015),
        ]);
        await fetchVariantCounts('study_mutations', [
            mutation('KRAS', 3845, 'KRAS G12 missense'),
            mutation('BRAF', 673, 'BRAF V600 missense'),
        ]);

        expect(fetch.calls).toEqual([
            {
                url:
                    '/api/molecular-profiles/study_mutations/variant-counts/fetch',
                body: [{ entrezGeneId: 3845, keyword: 'KRAS G12 missense' }],
            },
            {
                url:
                    '/api/molecular-profiles/study_mutations/variant-counts/fetch',
                body: [{ entrezGeneId: 673, keyword: 'BRAF V600 missense' }],
            },
        ]);
        expect(
            counts.get(
                variantCountKey('study_mutations', 3845, 'KRAS G12 missense')
            )
        ).toEqual(
            expect.objectContaining({
                numberOfSamples: 120,
                numberOfSamplesWithKeyword: 3,
            })
        );
    });

    it('makes no request for mutations without a keyword', async () => {
        const fetch = installFetch([]);
        const counts = await fetchVariantCounts('study_mutations', [
            mutation('TERT', 7015),
        ]);
        expect(counts.size).toBe(0);
        expect(fetch.calls).toHaveLength(0);
    });
});

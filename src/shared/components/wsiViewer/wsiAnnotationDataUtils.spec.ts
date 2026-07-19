/**
 * @jest-environment jsdom
 */
import {
    clearWsiAnnotationRequestCaches,
    fetchCivicCnaAnnotations,
    fetchCivicMutationAnnotations,
    fetchCivicMutationAnnotationsReadOnly,
    fetchOncoKbCnaAnnotations,
    fetchOncoKbMutationAnnotations,
    fetchOncoKbMutationAnnotationsReadOnly,
    fetchOncoKbStructuralVariantAnnotations,
} from './wsiAnnotationDataUtils';

jest.mock('cbioportal-utils', () => {
    const actual = jest.requireActual('cbioportal-utils');
    return {
        ...actual,
        buildCivicEntry: jest.fn((_geneSummary, variants) => ({ variants })),
        getCivicGenes: jest.fn(),
        getCivicVariants: jest.fn(),
    };
});

jest.mock('shared/lib/CivicUtils', () => ({
    getCivicCNAVariants: jest.fn(),
}));

describe('wsiAnnotationDataUtils request caching', () => {
    let originalFetch: typeof globalThis.fetch;
    let getCivicGenesMock: jest.Mock;
    let getCivicVariantsMock: jest.Mock;
    let getCivicCNAVariantsMock: jest.Mock;

    beforeEach(() => {
        originalFetch = (global as any).fetch;
        clearWsiAnnotationRequestCaches();

        const civicUtils = jest.requireMock('cbioportal-utils');
        getCivicGenesMock = civicUtils.getCivicGenes;
        getCivicVariantsMock = civicUtils.getCivicVariants;
        getCivicGenesMock.mockReset();
        getCivicVariantsMock.mockReset();

        const localCivicUtils = jest.requireMock('shared/lib/CivicUtils');
        getCivicCNAVariantsMock = localCivicUtils.getCivicCNAVariants;
        getCivicCNAVariantsMock.mockReset();
    });

    afterEach(() => {
        (global as any).fetch = originalFetch;
        clearWsiAnnotationRequestCaches();
    });

    it('reuses the OncoKB mutation annotation request for the same detail set', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve([
                    {
                        query: { id: '3845_G12D_Missense_Mutation' },
                        oncogenic: 'Oncogenic',
                    },
                ]),
        });
        (global as any).fetch = fetchMock;

        const details = [
            {
                token: 'KRAS p.G12D',
                entrezGeneId: 3845,
                consequence: 'Missense_Mutation',
            },
        ] as any;

        await fetchOncoKbMutationAnnotations('http://tile', details);
        await fetchOncoKbMutationAnnotations('http://tile', details);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toContain('/api/oncokb/annotate');
    });

    it('returns cloned OncoKB mutation annotations so callers cannot mutate the shared cache', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve([
                    {
                        query: { id: '3845_G12D_Missense_Mutation' },
                        oncogenic: 'Oncogenic',
                        mutationEffect: { knownEffect: 'Gain-of-function' },
                    },
                ]),
        });
        (global as any).fetch = fetchMock;

        const details = [
            {
                token: 'KRAS p.G12D',
                entrezGeneId: 3845,
                consequence: 'Missense_Mutation',
            },
        ] as any;

        const first = await fetchOncoKbMutationAnnotations('http://tile', details);
        expect(first).not.toBeNull();
        first![0].oncogenic = 'Mutated';

        const second = await fetchOncoKbMutationAnnotations(
            'http://tile',
            details
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second).toEqual([
            {
                id: '3845_G12D_Missense_Mutation',
                oncogenic: 'Oncogenic',
                mutationEffect: 'Gain-of-function',
                hotspot: undefined,
                geneSummary: undefined,
                variantSummary: undefined,
                variantExist: undefined,
            },
        ]);
        expect(second).not.toBe(first);
    });

    it('reuses the cached OncoKB mutation annotation reference for read-only callers', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve([
                    {
                        query: { id: '3845_G12D_Missense_Mutation' },
                        oncogenic: 'Oncogenic',
                    },
                ]),
        });
        (global as any).fetch = fetchMock;

        const details = [
            {
                token: 'KRAS p.G12D',
                entrezGeneId: 3845,
                consequence: 'Missense_Mutation',
            },
        ] as any;

        const first = await fetchOncoKbMutationAnnotationsReadOnly(
            'http://tile',
            details
        );
        const second = await fetchOncoKbMutationAnnotationsReadOnly(
            'http://tile',
            details
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
    });

    it('reuses the OncoKB mutation annotation request when the same details arrive in a different order', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve([
                    {
                        query: { id: '3845_G12D_Missense_Mutation' },
                        oncogenic: 'Oncogenic',
                    },
                    {
                        query: { id: '1956_L858R_Missense_Mutation' },
                        oncogenic: 'Oncogenic',
                    },
                ]),
        });
        (global as any).fetch = fetchMock;

        const firstDetails = [
            {
                token: 'KRAS p.G12D',
                entrezGeneId: 3845,
                consequence: 'Missense_Mutation',
            },
            {
                token: 'EGFR p.L858R',
                entrezGeneId: 1956,
                consequence: 'Missense_Mutation',
            },
        ] as any;
        const secondDetails = [...firstDetails].reverse() as any;

        await fetchOncoKbMutationAnnotations('http://tile', firstDetails);
        await fetchOncoKbMutationAnnotations('http://tile', secondDetails);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual([
            {
                id: '1956_L858R_Missense_Mutation',
                alteration: 'L858R',
                consequence: 'Missense_Mutation',
                gene: { entrezGeneId: 1956 },
                tumorType: null,
            },
            {
                id: '3845_G12D_Missense_Mutation',
                alteration: 'G12D',
                consequence: 'Missense_Mutation',
                gene: { entrezGeneId: 3845 },
                tumorType: null,
            },
        ]);
    });

    it('reuses the CIViC mutation lookup for the same detail set', async () => {
        getCivicGenesMock.mockResolvedValue({
            KRAS: { description: 'KRAS summary' },
        });
        getCivicVariantsMock.mockResolvedValue({
            KRAS: { G12D: { id: 1 } },
        });

        const details = [{ token: 'KRAS p.G12D' }] as any;

        await fetchCivicMutationAnnotations(details);
        await fetchCivicMutationAnnotations(details);

        expect(getCivicGenesMock).toHaveBeenCalledTimes(1);
        expect(getCivicVariantsMock).toHaveBeenCalledTimes(1);
    });

    it('returns cloned CIViC mutation annotations so callers cannot mutate the shared cache', async () => {
        getCivicGenesMock.mockResolvedValue({
            KRAS: { description: 'KRAS summary' },
        });
        getCivicVariantsMock.mockResolvedValue({
            KRAS: { G12D: { id: 1 } },
        });

        const details = [{ token: 'KRAS p.G12D' }] as any;

        const first = await fetchCivicMutationAnnotations(details);
        expect(first).not.toBeNull();
        first![0].hasCivic = false;
        if (first![0].civicEntry) {
            (first![0].civicEntry as any).variants = {};
        }

        const second = await fetchCivicMutationAnnotations(details);

        expect(getCivicGenesMock).toHaveBeenCalledTimes(1);
        expect(getCivicVariantsMock).toHaveBeenCalledTimes(1);
        expect(second?.[0].hasCivic).toBe(true);
        expect(second?.[0].civicEntry).toEqual({
            variants: { G12D: { id: 1 } },
        });
        expect(second).not.toBe(first);
    });

    it('reuses the cached CIViC mutation annotation reference for read-only callers', async () => {
        getCivicGenesMock.mockResolvedValue({
            KRAS: { description: 'KRAS summary' },
        });
        getCivicVariantsMock.mockResolvedValue({
            KRAS: { G12D: { id: 1 } },
        });

        const details = [{ token: 'KRAS p.G12D' }] as any;

        const first = await fetchCivicMutationAnnotationsReadOnly(details);
        const second = await fetchCivicMutationAnnotationsReadOnly(details);

        expect(getCivicGenesMock).toHaveBeenCalledTimes(1);
        expect(getCivicVariantsMock).toHaveBeenCalledTimes(1);
        expect(second).toBe(first);
    });

    it('reuses the CIViC mutation lookup when the same details arrive in a different order', async () => {
        getCivicGenesMock.mockResolvedValue({
            EGFR: { description: 'EGFR summary' },
            KRAS: { description: 'KRAS summary' },
        });
        getCivicVariantsMock.mockResolvedValue({
            EGFR: { L858R: { id: 2 } },
            KRAS: { G12D: { id: 1 } },
        });

        const firstDetails = [
            { token: 'KRAS p.G12D' },
            { token: 'EGFR p.L858R' },
        ] as any;
        const secondDetails = [...firstDetails].reverse() as any;

        await fetchCivicMutationAnnotations(firstDetails);
        await fetchCivicMutationAnnotations(secondDetails);

        expect(getCivicGenesMock).toHaveBeenCalledTimes(1);
        expect(getCivicVariantsMock).toHaveBeenCalledTimes(1);
        expect(getCivicGenesMock.mock.calls[0][0]).toEqual(['EGFR', 'KRAS']);
        expect(getCivicVariantsMock.mock.calls[0][1]).toEqual([
            {
                gene: { hugoGeneSymbol: 'EGFR' },
                proteinChange: 'L858R',
            },
            {
                gene: { hugoGeneSymbol: 'KRAS' },
                proteinChange: 'G12D',
            },
        ]);
    });

    it('reuses the CIViC mutation lookup when duplicate details are present', async () => {
        getCivicGenesMock.mockResolvedValue({
            KRAS: { description: 'KRAS summary' },
        });
        getCivicVariantsMock.mockResolvedValue({
            KRAS: { G12D: { id: 1 } },
        });

        const dedupedDetails = [{ token: 'KRAS p.G12D' }] as any;
        const duplicateDetails = [
            { token: 'KRAS p.G12D' },
            { token: 'KRAS p.G12D' },
        ] as any;

        await fetchCivicMutationAnnotations(dedupedDetails);
        await fetchCivicMutationAnnotations(duplicateDetails);

        expect(getCivicGenesMock).toHaveBeenCalledTimes(1);
        expect(getCivicVariantsMock).toHaveBeenCalledTimes(1);
        expect(getCivicVariantsMock.mock.calls[0][1]).toEqual([
            {
                gene: { hugoGeneSymbol: 'KRAS' },
                proteinChange: 'G12D',
            },
        ]);
    });

    it('reuses the OncoKB CNA annotation request for the same CNA set', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve([
                    {
                        query: { id: '672_AMPLIFICATION' },
                        oncogenic: 'Likely Oncogenic',
                    },
                ]),
        });
        (global as any).fetch = fetchMock;

        const cnas = [
            {
                gene: 'BRCA1',
                entrezGeneId: 672,
                cnaValue: 2,
            },
        ] as any;

        await fetchOncoKbCnaAnnotations('http://tile', cnas);
        await fetchOncoKbCnaAnnotations('http://tile', cnas);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toContain(
            '/api/oncokb/annotate-copy-number'
        );
    });

    it('reuses the OncoKB CNA annotation request when the same CNAs arrive in a different order', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve([
                    {
                        query: { id: '672_AMPLIFICATION' },
                        oncogenic: 'Likely Oncogenic',
                    },
                    {
                        query: { id: '1956_AMPLIFICATION' },
                        oncogenic: 'Likely Oncogenic',
                    },
                ]),
        });
        (global as any).fetch = fetchMock;

        const firstCnas = [
            {
                gene: 'BRCA1',
                entrezGeneId: 672,
                cnaValue: 2,
            },
            {
                gene: 'EGFR',
                entrezGeneId: 1956,
                cnaValue: 2,
            },
        ] as any;
        const secondCnas = [...firstCnas].reverse() as any;

        await fetchOncoKbCnaAnnotations('http://tile', firstCnas);
        await fetchOncoKbCnaAnnotations('http://tile', secondCnas);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual([
            {
                id: '672_AMPLIFICATION',
                copyNameAlterationType: 'AMPLIFICATION',
                gene: { entrezGeneId: 672 },
                referenceGenome: 'GRCh37',
                tumorType: null,
            },
            {
                id: '1956_AMPLIFICATION',
                copyNameAlterationType: 'AMPLIFICATION',
                gene: { entrezGeneId: 1956 },
                referenceGenome: 'GRCh37',
                tumorType: null,
            },
        ]);
    });

    it('reuses the CIViC CNA lookup for the same CNA set', async () => {
        getCivicGenesMock.mockResolvedValue({
            BRCA1: { description: 'BRCA1 summary' },
        });
        getCivicVariantsMock.mockResolvedValue({
            BRCA1: { amplification: { id: 1 } },
        });
        getCivicCNAVariantsMock.mockReturnValue({ amplification: { id: 1 } });

        const cnas = [{ gene: 'BRCA1', cnaValue: 2 }] as any;

        await fetchCivicCnaAnnotations(cnas);
        await fetchCivicCnaAnnotations(cnas);

        expect(getCivicGenesMock).toHaveBeenCalledTimes(1);
        expect(getCivicVariantsMock).toHaveBeenCalledTimes(1);
    });

    it('reuses the CIViC CNA lookup when the same CNAs arrive in a different order', async () => {
        getCivicGenesMock.mockResolvedValue({
            BRCA1: { description: 'BRCA1 summary' },
            EGFR: { description: 'EGFR summary' },
        });
        getCivicVariantsMock.mockResolvedValue({
            BRCA1: { amplification: { id: 1 } },
            EGFR: { amplification: { id: 2 } },
        });
        getCivicCNAVariantsMock.mockReturnValue({ amplification: { id: 1 } });

        const firstCnas = [
            { gene: 'BRCA1', cnaValue: 2 },
            { gene: 'EGFR', cnaValue: 2 },
        ] as any;
        const secondCnas = [...firstCnas].reverse() as any;

        await fetchCivicCnaAnnotations(firstCnas);
        await fetchCivicCnaAnnotations(secondCnas);

        expect(getCivicGenesMock).toHaveBeenCalledTimes(1);
        expect(getCivicVariantsMock).toHaveBeenCalledTimes(1);
        expect(getCivicGenesMock.mock.calls[0][0]).toEqual(['BRCA1', 'EGFR']);
    });

    it('reuses the CIViC CNA lookup when duplicate CNAs are present', async () => {
        getCivicGenesMock.mockResolvedValue({
            BRCA1: { description: 'BRCA1 summary' },
        });
        getCivicVariantsMock.mockResolvedValue({
            BRCA1: { amplification: { id: 1 } },
        });
        getCivicCNAVariantsMock.mockReturnValue({ amplification: { id: 1 } });

        const dedupedCnas = [{ gene: 'BRCA1', cnaValue: 2 }] as any;
        const duplicateCnas = [
            { gene: 'BRCA1', cnaValue: 2 },
            { gene: 'BRCA1', cnaValue: 2 },
        ] as any;

        await fetchCivicCnaAnnotations(dedupedCnas);
        await fetchCivicCnaAnnotations(duplicateCnas);

        expect(getCivicGenesMock).toHaveBeenCalledTimes(1);
        expect(getCivicVariantsMock).toHaveBeenCalledTimes(1);
    });

    it('reuses the OncoKB structural variant annotation request for the same variant set', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve([
                    {
                        query: { id: 'ALK--EML4-fusion' },
                        oncogenic: 'Oncogenic',
                    },
                ]),
        });
        (global as any).fetch = fetchMock;

        const structuralVariants = [
            {
                gene1: 'EML4',
                gene2: 'ALK',
                site1EntrezGeneId: 27436,
                site2EntrezGeneId: 238,
                variantClass: 'Fusion',
            },
        ] as any;

        await fetchOncoKbStructuralVariantAnnotations(
            'http://tile',
            structuralVariants
        );
        await fetchOncoKbStructuralVariantAnnotations(
            'http://tile',
            structuralVariants
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toContain(
            '/api/oncokb/annotate-structural-variants'
        );
    });

    it('reuses the OncoKB structural variant annotation request when the same variants arrive in a different order', async () => {
        const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve([
                    {
                        query: { id: 'ALK--EML4-fusion' },
                        oncogenic: 'Oncogenic',
                    },
                    {
                        query: { id: 'RET--CCDC6-fusion' },
                        oncogenic: 'Oncogenic',
                    },
                ]),
        });
        (global as any).fetch = fetchMock;

        const firstStructuralVariants = [
            {
                gene1: 'EML4',
                gene2: 'ALK',
                site1EntrezGeneId: 27436,
                site2EntrezGeneId: 238,
                variantClass: 'Fusion',
            },
            {
                gene1: 'CCDC6',
                gene2: 'RET',
                site1EntrezGeneId: 8030,
                site2EntrezGeneId: 5979,
                variantClass: 'Fusion',
            },
        ] as any;
        const secondStructuralVariants =
            [...firstStructuralVariants].reverse() as any;

        await fetchOncoKbStructuralVariantAnnotations(
            'http://tile',
            firstStructuralVariants
        );
        await fetchOncoKbStructuralVariantAnnotations(
            'http://tile',
            secondStructuralVariants
        );

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual([
            {
                id: '8030_5979_FUSION',
                geneA: { entrezGeneId: 8030 },
                geneB: { entrezGeneId: 5979 },
                structuralVariantType: 'FUSION',
                functionalFusion: true,
                tumorType: null,
            },
            {
                id: '27436_238_FUSION',
                geneA: { entrezGeneId: 27436 },
                geneB: { entrezGeneId: 238 },
                structuralVariantType: 'FUSION',
                functionalFusion: true,
                tumorType: null,
            },
        ]);
    });
});

/**
 * @jest-environment jsdom
 */
import {
    clearWsiMolecularAnnotationRequestCaches,
    fetchCivicCnaAnnotations,
    fetchCivicMutationAnnotations,
    fetchOncoKbCnaAnnotations,
    fetchOncoKbMutationAnnotations,
    fetchOncoKbStructuralVariantAnnotations,
} from './wsiMolecularAnnotationDataUtils';
import {
    configureWsiViewerRuntime,
    resetWsiViewerRuntime,
} from './wsiViewerConfig';
import { MutationDetail } from './wsiViewerTypes';

jest.mock('cbioportal-utils', () => {
    const actual = jest.requireActual('cbioportal-utils');
    return {
        ...actual,
        buildCivicEntry: jest.fn((_geneSummary, variants) => ({ variants })),
        getCivicGenes: jest.fn(),
        getCivicVariants: jest.fn(),
    };
});

const mockOncoKbClient = {
    annotateMutationsByProteinChangePostUsingPOST_1: jest.fn(),
    annotateCopyNumberAlterationsPostUsingPOST_1: jest.fn(),
    annotateStructuralVariantsPostUsingPOST_1: jest.fn(),
};
const mockGetCivicCnaVariants = jest.fn();
const civicUtils = jest.requireMock('cbioportal-utils');

const indicator = (id: string) => ({
    query: { id },
    oncogenic: 'Oncogenic',
    mutationEffect: { knownEffect: 'Gain-of-function' },
    hotspot: true,
    geneSummary: 'Gene summary',
    variantSummary: 'Variant summary',
});

const KRAS: MutationDetail = {
    token: 'KRAS G12D',
    gene: 'KRAS',
    proteinChange: 'G12D',
    entrezGeneId: 3845,
    consequence: 'Missense_Mutation',
};

beforeEach(() => {
    clearWsiMolecularAnnotationRequestCaches();
    Object.values(mockOncoKbClient).forEach(fn => fn.mockReset());
    mockGetCivicCnaVariants.mockReset();
    civicUtils.getCivicGenes.mockReset();
    civicUtils.getCivicVariants.mockReset();
    configureWsiViewerRuntime({
        buildApiUrl: (path: string) => `/${path}`,
        molecular: {
            showOncoKb: () => true,
            showCivic: () => true,
            getOncoKbApiUrl: () => '/proxy/oncokb',
            getOncoKbClient: () => mockOncoKbClient as any,
            getCivicCnaVariants: mockGetCivicCnaVariants,
            getSimplifiedMutationType: (type: string) => type.toLowerCase(),
        },
    });
});

afterEach(() => {
    jest.restoreAllMocks();
    resetWsiViewerRuntime();
});

describe('OncoKB annotations', () => {
    it('annotates mutations with the tumor type and genome, once per variant set', async () => {
        mockOncoKbClient.annotateMutationsByProteinChangePostUsingPOST_1.mockResolvedValue(
            [indicator('3845_G12D_Missense_Mutation_COAD')]
        );

        const annotations = await fetchOncoKbMutationAnnotations(
            [{ entry: KRAS, tumorType: 'COAD' }],
            'GRCh38'
        );
        await fetchOncoKbMutationAnnotations(
            [
                { entry: KRAS, tumorType: 'COAD' },
                { entry: KRAS, tumorType: 'COAD' },
            ],
            'GRCh38'
        );

        expect(
            mockOncoKbClient.annotateMutationsByProteinChangePostUsingPOST_1
        ).toHaveBeenCalledTimes(1);
        expect(
            mockOncoKbClient.annotateMutationsByProteinChangePostUsingPOST_1
        ).toHaveBeenCalledWith({
            body: [
                expect.objectContaining({
                    alteration: 'G12D',
                    tumorType: 'COAD',
                    referenceGenome: 'GRCh38',
                }),
            ],
        });
        expect(annotations).toEqual([
            {
                id: '3845_G12D_Missense_Mutation_COAD',
                oncogenic: 'Oncogenic',
                mutationEffect: 'Gain-of-function',
                hotspot: true,
                geneSummary: 'Gene summary',
                variantSummary: 'Variant summary',
            },
        ]);
    });

    it('logs a failed request, resolves it to null and asks again next time', async () => {
        const debug = jest.spyOn(console, 'debug').mockImplementation(() => {});
        mockOncoKbClient.annotateCopyNumberAlterationsPostUsingPOST_1
            .mockRejectedValueOnce(new Error('503'))
            .mockResolvedValueOnce([indicator('2064_AMPLIFICATION_')]);
        const cnas = [
            {
                entry: { gene: 'ERBB2', entrezGeneId: 2064, cnaValue: 2 },
                tumorType: null,
            },
        ];

        await expect(
            fetchOncoKbCnaAnnotations(cnas, 'GRCh37')
        ).resolves.toBeNull();
        expect(debug).toHaveBeenCalledWith(
            '[WSI] OncoKB cna annotation unavailable',
            expect.any(Error)
        );
        await expect(
            fetchOncoKbCnaAnnotations(cnas, 'GRCh37')
        ).resolves.toEqual([
            expect.objectContaining({ id: '2064_AMPLIFICATION_' }),
        ]);
    });

    it('makes no request without annotatable variants', async () => {
        await expect(
            fetchOncoKbStructuralVariantAnnotations(
                [
                    {
                        entry: { gene1: '—', gene2: '—', variantClass: 'SV' },
                        tumorType: null,
                    },
                ],
                'GRCh37'
            )
        ).resolves.toBeNull();
        expect(
            mockOncoKbClient.annotateStructuralVariantsPostUsingPOST_1
        ).not.toHaveBeenCalled();
    });
});

describe('CIViC annotations', () => {
    it('looks up the mutations once per variant set', async () => {
        civicUtils.getCivicGenes.mockResolvedValue({ KRAS: { name: 'KRAS' } });
        civicUtils.getCivicVariants.mockResolvedValue({
            KRAS: { G12D: { id: 1 } },
        });

        const annotations = await fetchCivicMutationAnnotations([KRAS]);
        await fetchCivicMutationAnnotations([KRAS, KRAS]);

        expect(civicUtils.getCivicGenes).toHaveBeenCalledTimes(1);
        expect(civicUtils.getCivicGenes).toHaveBeenCalledWith(['KRAS']);
        expect(annotations).toEqual([
            {
                token: 'KRAS G12D',
                civicEntry: { variants: { G12D: { id: 1 } } },
            },
        ]);
    });

    it('requests only the genes of amplifications and deep deletions', async () => {
        civicUtils.getCivicGenes.mockResolvedValue({
            ERBB2: { name: 'ERBB2', description: 'gene' },
        });
        civicUtils.getCivicVariants.mockResolvedValue({});
        mockGetCivicCnaVariants.mockReturnValue({ ERBB2: { id: 2 } });

        const annotations = await fetchCivicCnaAnnotations([
            { gene: 'ERBB2', cnaValue: 2 },
            { gene: 'MYC', cnaValue: 1 },
            { gene: 'PTEN', cnaValue: -1 },
        ]);

        expect(civicUtils.getCivicGenes).toHaveBeenCalledWith(['ERBB2']);
        expect(annotations).toEqual([
            {
                gene: 'ERBB2',
                cnaValue: 2,
                civicEntry: { variants: { ERBB2: { id: 2 } } },
                hasCivicVariants: true,
            },
        ]);
    });

    it('makes no request for gains and shallow losses only', async () => {
        await expect(
            fetchCivicCnaAnnotations([{ gene: 'MYC', cnaValue: 1 }])
        ).resolves.toBeNull();
        expect(civicUtils.getCivicGenes).not.toHaveBeenCalled();
    });

    it('logs a failed lookup and resolves it to null', async () => {
        const debug = jest.spyOn(console, 'debug').mockImplementation(() => {});
        civicUtils.getCivicGenes.mockRejectedValue(new Error('offline'));

        await expect(fetchCivicMutationAnnotations([KRAS])).resolves.toBeNull();
        expect(debug).toHaveBeenCalledWith(
            '[WSI] CIViC mutation annotation unavailable',
            expect.any(Error)
        );
    });
});

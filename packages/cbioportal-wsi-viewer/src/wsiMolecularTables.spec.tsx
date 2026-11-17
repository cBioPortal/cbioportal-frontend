/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import {
    CnaTable,
    MutationTable,
    StructuralVariantTable,
} from './wsiMolecularTables';
import { MutationDetail, Sample } from './wsiViewerTypes';
import {
    configureWsiViewerRuntime,
    resetWsiViewerRuntime,
} from './wsiViewerConfig';

function configureAnnotations(
    showOncoKb: boolean,
    showCivic: boolean,
    showHotspots = true
) {
    configureWsiViewerRuntime({
        buildApiUrl: (path: string) => `/${path}`,
        molecular: {
            showOncoKb: () => showOncoKb,
            showCivic: () => showCivic,
            getOncoKbApiUrl: () => '/proxy/oncokb',
            getOncoKbClient: () => ({} as any),
            getCivicCnaVariants: () => ({}),
            getSimplifiedMutationType: type => type.toLowerCase(),
            showHotspots: () => showHotspots,
            getHotspots: () => Promise.resolve([]),
        },
    });
}

afterEach(() => resetWsiViewerRuntime());

function makeSample(overrides: Partial<Sample> = {}): Sample {
    return { sample_id: 'S-1', parts: [], ...overrides };
}

const KRAS: MutationDetail = {
    token: 'KRAS G12D',
    gene: 'KRAS',
    proteinChange: 'G12D',
    type: 'Missense',
    consequence: 'Missense_Mutation',
    vaf: 35,
    cohortAlteredCount: 3,
    cohortProfiledCount: 120,
};

describe('MutationTable states', () => {
    it.each([
        ['loading', 'wsi-mutation-table-loading', 'Loading variants…'],
        ['error', 'wsi-mutation-table-error', 'Variant data unavailable.'],
        [
            'unprofiled',
            'wsi-mutation-table-unprofiled',
            'Not profiled for mutations.',
        ],
    ] as const)('shows the %s status', (status, testId, text) => {
        render(
            <MutationTable sample={makeSample()} mutationDataStatus={status} />
        );
        expect(screen.getByTestId(testId).textContent).toBe(text);
    });

    it('tells a sample without mutations from one not profiled', () => {
        const { rerender } = render(
            <MutationTable
                sample={makeSample({ mutations: [] })}
                mutationDataStatus="ready"
            />
        );
        expect(screen.getByTestId('wsi-mutation-table-empty').textContent).toBe(
            'No mutations.'
        );

        rerender(
            <MutationTable
                sample={makeSample()}
                mutationDataStatus="unprofiled"
            />
        );
        expect(screen.queryByTestId('wsi-mutation-table-empty')).toBeNull();
        expect(
            screen.getByTestId('wsi-mutation-table-unprofiled')
        ).toBeTruthy();
    });

    it('shows nothing for a sample whose mutations were not loaded', () => {
        const { container } = render(
            <MutationTable sample={makeSample()} mutationDataStatus="ready" />
        );
        expect(container.innerHTML).toBe('');
    });

    it('goes from loading to the table', () => {
        const sample = makeSample();
        const { rerender } = render(
            <MutationTable sample={sample} mutationDataStatus="loading" />
        );

        rerender(
            <MutationTable
                sample={{ ...sample, mutations: [KRAS] }}
                mutationDataStatus="ready"
            />
        );

        expect(screen.getByRole('table')).toBeTruthy();
        expect(screen.getByText('G12D')).toBeTruthy();
    });

    it('shows non-protein changes without a p. prefix', () => {
        render(
            <MutationTable
                sample={makeSample({
                    mutations: [
                        {
                            token: 'TERT Promoter',
                            gene: 'TERT',
                            proteinChange: 'Promoter',
                        },
                        { token: 'NF1', gene: 'NF1', proteinChange: '' },
                    ],
                })}
            />
        );
        expect(screen.getByText('Promoter')).toBeTruthy();
        expect(screen.getByText('—')).toBeTruthy();
        expect(screen.queryByText(/p\./)).toBeNull();
    });

    it('labels germline mutations', () => {
        render(
            <MutationTable
                sample={makeSample({
                    mutations: [
                        { ...KRAS, germline: true },
                        {
                            token: 'TP53 R175H',
                            gene: 'TP53',
                            proteinChange: 'R175H',
                        },
                    ],
                })}
            />
        );

        const labels = screen.getAllByTestId('wsi-mutation-germline');
        expect(labels).toHaveLength(1);
        expect(labels[0].textContent).toBe('Germline');
        expect(labels[0].closest('tr')!.textContent).toContain('KRAS');
    });
});

describe('molecular table details', () => {
    it('gives the mutation details to keyboard and screen reader users', () => {
        render(
            <MutationTable
                sample={makeSample({
                    mutations: [KRAS],
                    cna_alterations: [{ gene: 'KRAS', cnaValue: 2 }],
                })}
            />
        );

        const value = screen.getByText('G12D');
        expect(value.getAttribute('tabindex')).toBe('0');
        expect(value.textContent).toBe(
            'G12D: Type: Missense; VAF: 35%; Copy number: AMP; Samples in study with this variant: 3/120 (2.5%)'
        );

        act(() => {
            fireEvent.focus(value);
        });
        expect(screen.getByRole('tooltip').textContent).toContain(
            'Samples in study with this variant: 3/120 (2.5%)'
        );
    });

    it('gives the copy-number study counts', () => {
        render(
            <CnaTable
                sample={makeSample({
                    cna_alterations: [
                        {
                            gene: 'ERBB2',
                            cnaValue: 2,
                            cohortAlteredCount: 10,
                            cohortProfiledCount: 200,
                        },
                    ],
                })}
            />
        );
        expect(screen.getByText('AMP').textContent).toBe(
            'AMP: Samples in study with this alteration: 10/200 (5.0%)'
        );
    });

    it('renders the structural variant table as its data changes', () => {
        const sample = makeSample({
            structural_variants: [
                {
                    gene1: 'EML4',
                    gene2: 'ALK',
                    variantClass: 'FUSION',
                    svStatus: 'SOMATIC',
                },
            ],
        });
        const { rerender, container } = render(
            <StructuralVariantTable sample={makeSample()} />
        );
        expect(container.innerHTML).toBe('');

        rerender(<StructuralVariantTable sample={sample} />);
        expect(screen.getByText('FUSION').textContent).toBe(
            'FUSION: Status: SOMATIC'
        );

        rerender(<StructuralVariantTable sample={makeSample()} />);
        expect(container.innerHTML).toBe('');
    });
});

describe('annotation column', () => {
    const annotatedSample = () =>
        makeSample({
            mutations: [
                { ...KRAS, oncogenic: 'Oncogenic', oncoKbStatus: 'complete' },
            ],
            cna_alterations: [
                {
                    gene: 'ERBB2',
                    entrezGeneId: 2064,
                    cnaValue: 2,
                    oncogenic: 'Oncogenic',
                    oncoKbStatus: 'complete',
                    civicEntry: {
                        name: 'ERBB2',
                        description: '',
                        url: 'https://civicdb.org',
                        variants: {},
                    },
                },
            ],
            structural_variants: [
                {
                    gene1: 'EML4',
                    gene2: 'ALK',
                    variantClass: 'FUSION',
                    oncogenic: 'Oncogenic',
                    oncoKbStatus: 'complete',
                },
            ],
        });

    function renderTables(sample: Sample) {
        return render(
            <>
                <MutationTable sample={sample} />
                <CnaTable sample={sample} />
                <StructuralVariantTable sample={sample} />
            </>
        );
    }

    it('shows no OncoKB link or icon and no Annot column when both services are off', () => {
        configureAnnotations(false, false);
        const { container } = renderTables(annotatedSample());

        expect(container.querySelector('a[href*="oncokb.org"]')).toBeNull();
        expect(
            container.querySelector('[data-test="oncogenic-icon-image"]')
        ).toBeNull();
        expect(
            container.querySelector('img[alt="Civic Variant Entry"]')
        ).toBeNull();
        expect(screen.queryByText('Annot')).toBeNull();
    });

    it('keeps the Annot column for hotspots without either service', () => {
        configureAnnotations(false, false);
        const { container } = render(
            <MutationTable
                sample={makeSample({
                    mutations: [{ ...KRAS, recurrentHotspot: true }],
                })}
            />
        );

        expect(screen.getByText('Annot')).toBeTruthy();
        expect(screen.getByTestId('wsi-hotspot-annotation')).toBeTruthy();
        expect(container.querySelector('a[href*="oncokb.org"]')).toBeNull();
    });

    it('draws no hotspot icon, column or sort when show_hotspot is off', () => {
        configureAnnotations(false, false, false);
        render(
            <MutationTable
                sample={makeSample({
                    mutations: [
                        { ...KRAS, vaf: 10, recurrentHotspot: true },
                        {
                            token: 'TP53 R175H',
                            gene: 'TP53',
                            proteinChange: 'R175H',
                            vaf: 80,
                            hotspot3d: true,
                        },
                    ],
                })}
            />
        );

        expect(screen.queryByTestId('wsi-hotspot-annotation')).toBeNull();
        expect(screen.queryByText('Annot')).toBeNull();
        // By VAF only.
        expect(screen.getAllByRole('row').map(row => row.textContent)).toEqual([
            'GeneVariant',
            expect.stringMatching(/^TP53/),
            expect.stringMatching(/^KRAS/),
        ]);
    });

    it('sorts Cancer Hotspots first when show_hotspot is on', () => {
        configureAnnotations(false, false);
        render(
            <MutationTable
                sample={makeSample({
                    mutations: [
                        { ...KRAS, vaf: 10, recurrentHotspot: true },
                        {
                            token: 'TP53 R175H',
                            gene: 'TP53',
                            proteinChange: 'R175H',
                            vaf: 80,
                        },
                    ],
                })}
            />
        );

        expect(screen.getAllByRole('row').map(row => row.textContent)).toEqual([
            'GeneVariantAnnot',
            expect.stringMatching(/^KRAS/),
            expect.stringMatching(/^TP53/),
        ]);
    });

    it("reads hotspots from Cancer Hotspots only, not OncoKB's flag or the driver annotation", () => {
        configureAnnotations(false, false);
        render(
            <MutationTable
                sample={makeSample({
                    mutations: [
                        {
                            ...KRAS,
                            hotspot: true,
                            annotation: 'KRAS G12D is a hotspot',
                        },
                    ],
                })}
            />
        );

        expect(screen.queryByTestId('wsi-hotspot-annotation')).toBeNull();
        expect(screen.queryByText('Annot')).toBeNull();
    });

    it('marks a hotspot new in Cancer Hotspots v3', () => {
        configureAnnotations(false, false);
        render(
            <MutationTable
                sample={makeSample({
                    mutations: [
                        { ...KRAS, recurrentHotspot: true, hotspotV3: true },
                    ],
                })}
            />
        );

        act(() => {
            fireEvent.focus(
                screen
                    .getByTestId('wsi-hotspot-annotation')
                    .querySelector('.chang_hotspot')!
            );
        });
        expect(screen.getByRole('tooltip').textContent).toContain(
            'Recurrent Hotspot (new in V3)'
        );
    });

    it('shows a 3D hotspot from Cancer Hotspots without either service', () => {
        configureAnnotations(false, false);
        render(
            <MutationTable
                sample={makeSample({
                    mutations: [{ ...KRAS, hotspot3d: true }],
                })}
            />
        );

        expect(screen.getByText('Annot')).toBeTruthy();
        expect(screen.getByTestId('wsi-hotspot-annotation')).toBeTruthy();
    });

    it('shows CIViC without OncoKB when only CIViC is on', () => {
        configureAnnotations(false, true);
        const { container } = renderTables(annotatedSample());

        expect(container.querySelector('a[href*="oncokb.org"]')).toBeNull();
        expect(
            container.querySelector('img[alt="Civic Variant Entry"]')
        ).not.toBeNull();
    });

    it('links each row to OncoKB with an accessible name when OncoKB is on', () => {
        configureAnnotations(true, false);
        renderTables(annotatedSample());

        const links = screen.getAllByTestId('wsi-oncokb-link');
        expect(links.map(link => link.getAttribute('href'))).toEqual([
            'https://www.oncokb.org/gene/KRAS/G12D',
            'https://www.oncokb.org/gene/ERBB2',
            'https://www.oncokb.org/gene/EML4',
        ]);
        expect(links[0].getAttribute('aria-label')).toBe(
            'OncoKB: Oncogenic for KRAS G12D (opens in a new tab)'
        );
        expect(
            document.querySelector('img[alt="Civic Variant Entry"]')
        ).toBeNull();
    });

    it('shows a pending OncoKB lookup as loading, not as unannotated', () => {
        configureAnnotations(true, false);
        render(
            <MutationTable
                sample={makeSample({
                    mutations: [
                        KRAS,
                        {
                            ...KRAS,
                            token: 'KRAS G13D',
                            proteinChange: 'G13D',
                            oncoKbStatus: 'pending',
                        },
                    ],
                })}
            />
        );

        const loading = screen.getAllByTestId('wsi-oncokb-loading');
        expect(loading).toHaveLength(2);
        expect(loading[0].getAttribute('role')).toBe('img');
        expect(loading.map(icon => icon.getAttribute('aria-label'))).toEqual(
            expect.arrayContaining([
                'OncoKB: loading the annotation of KRAS G12D',
                'OncoKB: loading the annotation of KRAS G13D',
            ])
        );
        expect(screen.queryByTestId('wsi-oncokb-link')).toBeNull();
        expect(screen.queryByLabelText(/not annotated/)).toBeNull();
    });

    it('shows a failed OncoKB lookup as an error, not as unannotated', () => {
        configureAnnotations(true, false);
        render(
            <CnaTable
                sample={makeSample({
                    cna_alterations: [
                        { gene: 'ERBB2', cnaValue: 2, oncoKbStatus: 'error' },
                    ],
                })}
            />
        );

        const error = screen.getByTestId('wsi-oncokb-error');
        expect(error.getAttribute('aria-label')).toBe(
            'OncoKB: annotation of ERBB2 AMP unavailable'
        );
        expect(error.getAttribute('tabindex')).toBe('0');
        act(() => {
            fireEvent.focus(error);
        });
        expect(screen.getByRole('tooltip').textContent).toBe(
            'Error fetching OncoKB data'
        );
        expect(screen.queryByTestId('wsi-oncokb-link')).toBeNull();
    });

    it('says a completed lookup without an annotation is not annotated', () => {
        configureAnnotations(true, false);
        render(
            <MutationTable
                sample={makeSample({
                    mutations: [{ ...KRAS, oncoKbStatus: 'complete' }],
                })}
            />
        );

        expect(
            screen.getByTestId('wsi-oncokb-link').getAttribute('aria-label')
        ).toBe('OncoKB: not annotated for KRAS G12D (opens in a new tab)');
    });

    it('opens the OncoKB card on focus and closes it on scroll', () => {
        configureAnnotations(true, false);
        render(
            <MutationTable
                sample={makeSample({
                    mutations: [
                        {
                            ...KRAS,
                            oncogenic: 'Oncogenic',
                            oncoKbStatus: 'complete',
                            geneSummary: 'KRAS summary',
                        },
                    ],
                })}
            />
        );

        act(() => {
            fireEvent.focus(screen.getByTestId('wsi-oncokb-link'));
        });
        expect(screen.getByText('KRAS summary')).toBeTruthy();

        act(() => {
            fireEvent.scroll(window);
        });
        expect(screen.queryByText('KRAS summary')).toBeNull();
    });

    it('puts oncogenic mutations first', () => {
        configureAnnotations(true, false);
        render(
            <MutationTable
                sample={makeSample({
                    mutations: [
                        { ...KRAS, vaf: 80, oncogenic: 'Unknown' },
                        {
                            token: 'TP53 R175H',
                            gene: 'TP53',
                            proteinChange: 'R175H',
                            vaf: 10,
                            oncogenic: 'Oncogenic',
                        },
                    ],
                })}
            />
        );

        expect(screen.getAllByRole('row').map(row => row.textContent)).toEqual([
            'GeneVariantAnnot',
            expect.stringMatching(/^TP53/),
            expect.stringMatching(/^KRAS/),
        ]);
    });
});

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

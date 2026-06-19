import { assert } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import { Mutation } from 'cbioportal-ts-api-client';
import { mutationTooltip, MutationStatus } from './PatientViewMutationsTabUtils';
import { VAFReport } from 'shared/lib/MutationUtils';

describe('PatientViewMutationsTabUtils', () => {
    describe('mutationTooltip', () => {
        // Based on real data from patient IM-GBM-33 in glioma_msk_2018
        // ARID1A X721_splice: called in Patient-33-CSF (alt=49, ref=239)
        // ARID1A X721_splice: uncalled in Patient-33-T (alt=0, ref=586)
        function makeMutation(
            hugoGeneSymbol: string,
            proteinChange: string
        ): Mutation {
            return {
                gene: { hugoGeneSymbol },
                proteinChange,
            } as Mutation;
        }

        it('shows VAF for MUTATED_WITH_VAF', () => {
            const mutation = makeMutation('ARID1A', 'X721_splice');
            const vafReport: VAFReport = {
                vaf: 49 / (49 + 239),
                variantReadCount: 49,
                totalReadCount: 49 + 239,
            };
            const html = renderToStaticMarkup(
                mutationTooltip(mutation, {
                    sampleId: 'Patient-33-CSF',
                    mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                    vafReport,
                })
            );
            assert.include(html, 'Gene: ARID1A');
            assert.include(html, 'Protein Change: X721_splice');
            assert.include(html, 'Sample ID: Patient-33-CSF');
            assert.include(html, 'VAF: 0.17');
            assert.include(html, '49 reads of 288 total');
        });

        it('shows "Mutation uncalled" for PROFILED_WITH_READS_BUT_UNCALLED', () => {
            // ARID1A G960E: called in Patient-33-T (alt=54, ref=246)
            // ARID1A G960E: uncalled in Patient-33-CSF (alt=0, ref=181)
            const mutation = makeMutation('ARID1A', 'G960E');
            const vafReport: VAFReport = {
                vaf: 0,
                variantReadCount: 0,
                totalReadCount: 181,
            };
            const html = renderToStaticMarkup(
                mutationTooltip(mutation, {
                    sampleId: 'Patient-33-CSF',
                    mutationStatus:
                        MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED,
                    vafReport,
                })
            );
            assert.include(html, 'Mutation uncalled');
            assert.include(html, 'VAF: 0.00');
            assert.include(html, '0 reads of 181 total');
            assert.notInclude(html, 'not detected');
        });

        it('shows "Mutation uncalled" without VAF when vafReport is null for PROFILED_WITH_READS_BUT_UNCALLED', () => {
            const mutation = makeMutation('ARID1A', 'G960E');
            const html = renderToStaticMarkup(
                mutationTooltip(mutation, {
                    sampleId: 'Patient-33-CSF',
                    mutationStatus:
                        MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED,
                    vafReport: null,
                })
            );
            assert.include(html, 'Mutation uncalled');
            assert.notInclude(html, 'VAF:');
            assert.notInclude(html, 'reads of');
        });

        it('shows "Mutation not detected" with VAF when vafReport is provided for PROFILED_BUT_NOT_MUTATED', () => {
            const mutation = makeMutation('ARID1A', 'X721_splice');
            const vafReport: VAFReport = {
                vaf: 0,
                variantReadCount: 0,
                totalReadCount: 586,
            };
            const html = renderToStaticMarkup(
                mutationTooltip(mutation, {
                    sampleId: 'Patient-33-T',
                    mutationStatus: MutationStatus.PROFILED_BUT_NOT_MUTATED,
                    vafReport,
                })
            );
            assert.include(html, 'Mutation not detected');
            assert.include(html, 'VAF: 0.00');
            assert.include(html, '0 reads of 586 total');
            assert.notInclude(html, 'uncalled');
        });

        it('shows "Mutation not detected" without VAF when vafReport is null for PROFILED_BUT_NOT_MUTATED', () => {
            // This is the key fix: when a sample is profiled but the mutation
            // is absent, we may not have per-sample read data (d.mutation
            // belongs to a different sample). Tooltip should not show
            // misleading read counts from another sample.
            const mutation = makeMutation('ARID1A', 'G836D');
            const html = renderToStaticMarkup(
                mutationTooltip(mutation, {
                    sampleId: 'Patient-33-T',
                    mutationStatus: MutationStatus.PROFILED_BUT_NOT_MUTATED,
                    vafReport: null,
                })
            );
            assert.include(html, 'Mutation not detected');
            assert.notInclude(html, 'VAF:');
            assert.notInclude(html, 'reads of');
        });

        it('shows "Mutated, but we don\'t have VAF data" for MUTATED_BUT_NO_VAF', () => {
            const mutation = makeMutation('ARID1A', 'G836D');
            const html = renderToStaticMarkup(
                mutationTooltip(mutation, {
                    sampleId: 'Patient-33-CSF',
                    mutationStatus: MutationStatus.MUTATED_BUT_NO_VAF,
                    vafReport: null,
                })
            );
            assert.include(html, "Mutated, but we don&#x27;t have VAF data");
        });

        it('shows not sequenced message for NOT_PROFILED', () => {
            const mutation = makeMutation('ARID1A', 'X721_splice');
            const html = renderToStaticMarkup(
                mutationTooltip(mutation, {
                    sampleId: 'Patient-33-T',
                    mutationStatus: MutationStatus.NOT_PROFILED,
                    vafReport: null,
                })
            );
            assert.include(
                html,
                'Patient-33-T is not sequenced for ARID1A mutations'
            );
        });

        it('shows only gene and protein change when no sample-specific info', () => {
            const mutation = makeMutation('ARID1A', 'X721_splice');
            const html = renderToStaticMarkup(mutationTooltip(mutation));
            assert.include(html, 'Gene: ARID1A');
            assert.include(html, 'Protein Change: X721_splice');
            assert.notInclude(html, 'Sample ID');
        });
    });
});

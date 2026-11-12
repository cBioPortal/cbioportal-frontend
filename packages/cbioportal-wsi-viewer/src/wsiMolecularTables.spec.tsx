/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import TestRenderer from 'react-test-renderer';
import { MutationTable } from './wsiMolecularTables';
import { Sample } from './wsiViewerTypes';

function makeSample(): Sample {
    return {
        sample_id: 'S-1',
        cancer_type: 'Test',
        cancer_type_detailed: 'Test',
        oncotree_code: 'TEST',
        primary_site: 'Test',
        sample_type: 'Primary',
        parts: [],
    };
}

describe('MutationTable loading states', () => {
    it('shows a loading status while mutation data is pending', () => {
        const renderer = TestRenderer.create(
            <MutationTable sample={makeSample()} mutationDataStatus="loading" />
        );

        expect(
            renderer.root.findByProps({
                'data-testid': 'wsi-mutation-table-loading',
            }).children
        ).toEqual(['Loading variants…']);
    });

    it('shows an actionable status when mutation data fails', () => {
        const renderer = TestRenderer.create(
            <MutationTable sample={makeSample()} mutationDataStatus="error" />
        );

        expect(
            renderer.root.findByProps({
                'data-testid': 'wsi-mutation-table-error',
            }).children
        ).toEqual(['Variant data unavailable.']);
    });

    it('handles a loading-to-success update without changing hook order', () => {
        const sample = makeSample();
        const renderer = TestRenderer.create(
            <MutationTable sample={sample} mutationDataStatus="loading" />
        );

        sample.oncogenic_mutations = 'TP53 p.R175H';
        sample.oncogenic_mutation_details = [{ token: 'TP53 p.R175H' }];
        TestRenderer.act(() => {
            renderer.update(
                <MutationTable sample={sample} mutationDataStatus="ready" />
            );
        });

        expect(renderer.root.findByType('table')).toBeDefined();
    });

    it('keeps fallback mutations visible while reporting an API error', () => {
        const sample = makeSample();
        sample.oncogenic_mutations = 'TP53 p.R175H';
        sample.oncogenic_mutation_details = [{ token: 'TP53 p.R175H' }];
        const renderer = TestRenderer.create(
            <MutationTable sample={sample} mutationDataStatus="error" />
        );

        expect(renderer.root.findByType('table')).toBeDefined();
        expect(
            renderer.root.findByProps({
                'data-testid': 'wsi-mutation-table-error',
            }).children
        ).toEqual(['Variant data unavailable.']);
    });
});

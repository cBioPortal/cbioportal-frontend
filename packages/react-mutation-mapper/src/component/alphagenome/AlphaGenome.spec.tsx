import { assert } from 'chai';
import { fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import {
    AlphaGenomeCell,
    AlphaGenomeTooltipContent,
    alphaGenomeLabel,
    sortValue,
    DISCLAIMER,
} from './AlphaGenome';
import { AlphaGenomeAnnotation } from 'genome-nexus-ts-api-client';

function annotationWithScores(
    scores: any[],
    scoreLevel: 'strong' | 'moderate' | null = 'strong'
): AlphaGenomeAnnotation {
    return {
        license: 'test',
        annotation: {
            variant: '7:g.140453136A>T',
            hg38_variant: 'chr7:140753336:A>T',
            scored_interval: 'chr7:140229048-141277624',
            model_version: 'alphagenome-v1',
            canonical_gene_id: 'ENSG00000157764',
            canonical_gene: 'BRAF',
            merged_splicing_score: 0.15,
            score_level: scoreLevel,
            scores,
        },
    } as AlphaGenomeAnnotation;
}

function row(
    outputType: string,
    rawScore: number | undefined,
    quantileScore: number | undefined,
    ontologyCurie?: string
) {
    return {
        output_type: outputType,
        variant_scorer: 'GeneMaskSplicingScorer',
        gene_id: 'ENSG00000157764',
        gene_name: 'BRAF',
        track_name: 'donor_plus',
        ontology_curie: ontologyCurie,
        biosample_name: 'pancreas',
        raw_score: rawScore,
        quantile_score: quantileScore,
    };
}

describe('AlphaGenome sidecar score_level badges', () => {
    it('reads score_level exclusively from annotation', () => {
        const strong = annotationWithScores([], 'strong');
        const moderate = annotationWithScores([], 'moderate');
        const low = annotationWithScores([], null);
        assert.equal(alphaGenomeLabel(strong), 'strong');
        assert.equal(alphaGenomeLabel(moderate), 'moderate');
        assert.isUndefined(alphaGenomeLabel(low));
        assert.isUndefined(alphaGenomeLabel(undefined));
    });

    it('sorts strong before moderate before scored-null before unscored', () => {
        const strong = annotationWithScores(
            [row('SPLICE_SITES', 0.6, 0.999)],
            'strong'
        );
        const moderate = annotationWithScores(
            [row('SPLICE_SITES', 0.3, 0.999)],
            'moderate'
        );
        const low = annotationWithScores(
            [row('SPLICE_SITES', 0.05, 0.5)],
            null
        );
        assert.isBelow(sortValue(strong), sortValue(moderate));
        assert.isBelow(sortValue(moderate), sortValue(low));
        assert.isBelow(sortValue(low), sortValue(undefined));
    });

    it('always carries the non-clinical disclaimer', () => {
        assert.include(DISCLAIMER, 'not experimental evidence');
    });
});

describe('AlphaGenomeCell across table sorts', () => {
    it('keeps the icon when a new annotation arrives under a stored tissue selection', () => {
        // react-table v6 reuses the cell instance by position on sort, so the
        // mounted tissue selection can belong to the previous row's mutation.
        // The cell must fall back to the new annotation's tissues, not blank.
        const before = annotationWithScores([
            row('RNA_SEQ', 0.9, 0.995, 'CL:0000001'),
        ]);
        const after = annotationWithScores([
            row('RNA_SEQ', 0.9, 0.995, 'CL:0000002'),
        ]);
        const { rerender, container } = render(
            <AlphaGenomeCell annotation={before} />
        );
        assert.include(container.textContent ?? '', 'αG');
        rerender(<AlphaGenomeCell annotation={after} />);
        assert.include(container.textContent ?? '', 'αG');
    });

    it('shows a spinner in the pinned slot while scoring with no annotation', () => {
        const { container } = render(
            <AlphaGenomeCell annotation={undefined} status="pending" />
        );
        assert.notInclude(container.textContent ?? '', 'αG');
        assert.isNotNull(
            container.querySelector('.fa-spinner'),
            'expected a loading spinner while pending'
        );
    });

    it('renders an empty pinned placeholder when idle with no annotation', () => {
        const { container } = render(
            <AlphaGenomeCell annotation={undefined} status="complete" />
        );
        assert.notInclude(container.textContent ?? '', 'αG');
        assert.isNull(container.querySelector('.fa-spinner'));
        assert.isNotNull(
            container.querySelector('.annotation-item'),
            'expected the pinned 22px placeholder slot'
        );
    });

    it('renders a light blue badge when scored with null score_level', () => {
        const annotation = annotationWithScores(
            [row('RNA_SEQ', 0.9, 0.5, 'CL:0000001')],
            null
        );
        const { container, getByText } = render(
            <AlphaGenomeCell annotation={annotation} status="complete" />
        );
        assert.include(container.textContent ?? '', 'αG');
        const badge = getByText('αG') as HTMLElement;
        assert.equal(badge.style.color, 'rgb(107, 174, 214)');
    });

    it('keeps the chart section when switching to the SPLICE_SITES output type', () => {
        // SPLICE_SITES rows carry no tissue: the section must fall back to a
        // track-bucketed bar instead of collapsing the tooltip content.
        const annotation = annotationWithScores([
            row('RNA_SEQ', 0.9, 0.995, 'CL:0000001'),
            row('SPLICE_SITES', 0.8, 0.995),
        ]);
        const { container, getByText, queryByText } = render(
            <AlphaGenomeTooltipContent annotation={annotation} />
        );
        const scroller = () =>
            Array.from(container.querySelectorAll('div')).find(
                d =>
                    (d as HTMLElement).style.maxHeight === '168px' &&
                    (d as HTMLElement).style.minHeight === '168px'
            );
        assert.isNotNull(queryByText('RNA_SEQ by tissue'));
        assert.isDefined(
            scroller(),
            'expected a fixed-height chart region before switching'
        );
        assert.isNull(queryByText('SPLICE_SITES by tissue'));
        fireEvent.click(getByText('SPLICE_SITES', { selector: 'a' }));
        assert.isNotNull(
            queryByText('SPLICE_SITES by tissue'),
            'expected the chart section to persist after switching output type'
        );
        assert.isDefined(
            scroller(),
            'expected the chart region to keep its fixed height after switching'
        );
    });

    it('keeps the chart section for SPLICE_SITES rows without tissue or track names', () => {
        // Bare-minimum splice rows (neither ontology_curie nor track_name)
        // must still render a bar: the output type itself is the fallback
        // label, so switching types never empties or resizes the section.
        const annotation = annotationWithScores([
            {
                output_type: 'SPLICE_SITES',
                variant_scorer: 'SpliceSiteScorer',
                gene_id: 'ENSG00000157764',
                gene_name: 'BRAF',
                track_name: null,
                ontology_curie: null,
                biosample_name: null,
                raw_score: 0.8,
                quantile_score: 0.995,
            },
        ]);
        const { container, getByText, queryByText } = render(
            <AlphaGenomeTooltipContent annotation={annotation} />
        );
        const scroller = () =>
            Array.from(container.querySelectorAll('div')).find(
                d =>
                    (d as HTMLElement).style.maxHeight === '168px' &&
                    (d as HTMLElement).style.minHeight === '168px'
            );
        assert.isDefined(
            scroller(),
            'expected a fixed-height chart region on initial render'
        );
        fireEvent.click(getByText('SPLICE_SITES', { selector: 'a' }));
        assert.isNotNull(
            queryByText('SPLICE_SITES by tissue'),
            'expected the chart section to persist without tissue or track names'
        );
        assert.isDefined(
            scroller(),
            'expected the chart region to keep its fixed height after switching'
        );
    });

    it('keeps the table icon after exploring a tissue with no passing score', async () => {
        // The tooltip tissue selector must not write back into the cell:
        // picking a failing tissue blanked the icon, removing the only way
        // to reopen the tooltip.
        const annotation = annotationWithScores([
            row('RNA_SEQ', 0.9, 0.995, 'CL:0000001'),
            row('RNA_SEQ', 0.01, 0.5, 'CL:0000002'),
        ]);
        const { container } = render(
            <AlphaGenomeCell annotation={annotation} />
        );
        assert.include(container.textContent ?? '', 'αG');
        fireEvent.mouseEnter(container.firstChild as Element);
        const select = await waitFor(() => {
            const el = document.body.querySelector('select');
            assert.isNotNull(el);
            return el as HTMLSelectElement;
        });
        fireEvent.change(select, { target: { value: 'CL:0000002' } });
        assert.include(container.textContent ?? '', 'αG');
        assert.include(document.body.textContent ?? '', 'CL:0000002');
    });
});

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { assert } from 'chai';

import {
    OncoKbCancerTypeCount,
    OncoKbOccurrenceList,
    sortCancerTypeCounts,
} from './OncoKbOccurrenceList';

const SAMPLE_COUNTS: OncoKbCancerTypeCount[] = [
    { cancerType: 'Cutaneous Melanoma', count: 5 },
    { cancerType: 'Prostate Adenocarcinoma', count: 1 },
    { cancerType: 'Stomach Adenocarcinoma', count: 1 },
    { cancerType: 'Papillary Thyroid Cancer', count: 2 },
    { cancerType: 'Colorectal Adenocarcinoma', count: 1 },
    { cancerType: 'Bladder Urothelial Carcinoma', count: 1 },
    { cancerType: 'Lung Adenocarcinoma', count: 3 },
];

// Count descending, then alphabetical for ties.
const SORTED_NAMES = [
    'Cutaneous Melanoma', // 5
    'Lung Adenocarcinoma', // 3
    'Papillary Thyroid Cancer', // 2
    'Bladder Urothelial Carcinoma', // 1
    'Colorectal Adenocarcinoma', // 1
    'Prostate Adenocarcinoma', // 1
    'Stomach Adenocarcinoma', // 1
];

function normalize(text: string | null): string {
    return (text || '').replace(/\s+/g, ' ').trim();
}

describe('sortCancerTypeCounts', () => {
    it('sorts by count descending, then alphabetically for ties', () => {
        const sorted = sortCancerTypeCounts(SAMPLE_COUNTS);
        assert.deepEqual(
            sorted.map(c => c.cancerType),
            SORTED_NAMES
        );
    });

    it('does not mutate the input array', () => {
        const input = [...SAMPLE_COUNTS];
        sortCancerTypeCounts(input);
        assert.deepEqual(input, SAMPLE_COUNTS);
    });
});

describe('OncoKbOccurrenceList', () => {
    it('renders a summary with pluralized sample and cancer type counts', () => {
        const { container } = render(
            <OncoKbOccurrenceList total={14} cancerTypeCounts={SAMPLE_COUNTS} />
        );
        assert.equal(
            normalize(container.querySelector('.summary')!.textContent),
            '7 cancer types · 14 samples'
        );
    });

    it('uses singular labels for a single sample and cancer type', () => {
        const { container } = render(
            <OncoKbOccurrenceList
                total={1}
                cancerTypeCounts={[
                    { cancerType: 'Cutaneous Melanoma', count: 1 },
                ]}
            />
        );
        assert.equal(
            normalize(container.querySelector('.summary')!.textContent),
            '1 cancer type · 1 sample'
        );
    });

    it('shows only the first 2 cancer types with a "+ N more" toggle', () => {
        const { container, getByRole } = render(
            <OncoKbOccurrenceList total={14} cancerTypeCounts={SAMPLE_COUNTS} />
        );

        const names = Array.from(
            container.querySelectorAll('.cancerType')
        ).map(n => normalize(n.textContent));
        assert.deepEqual(names, SORTED_NAMES.slice(0, 2));

        const toggle = getByRole('button');
        assert.equal(normalize(toggle.textContent), '+ 5 more');
        assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    });

    it('shows the full cancer type name in a title tooltip', () => {
        const { container } = render(
            <OncoKbOccurrenceList total={14} cancerTypeCounts={SAMPLE_COUNTS} />
        );
        const first = container.querySelector('.cancerType')!;
        assert.equal(first.getAttribute('title'), 'Cutaneous Melanoma');
    });

    it('expands and collapses via the keyboard-accessible toggle', () => {
        const { container, getByRole } = render(
            <OncoKbOccurrenceList total={14} cancerTypeCounts={SAMPLE_COUNTS} />
        );

        const toggle = getByRole('button');
        // Semantic button so it is focusable/operable via the keyboard.
        assert.equal(toggle.tagName, 'BUTTON');

        fireEvent.click(toggle);

        assert.equal(container.querySelectorAll('.cancerType').length, 7);
        assert.equal(normalize(toggle.textContent), 'Show less');
        assert.equal(toggle.getAttribute('aria-expanded'), 'true');

        fireEvent.click(toggle);

        assert.equal(container.querySelectorAll('.cancerType').length, 2);
        assert.equal(toggle.getAttribute('aria-expanded'), 'false');
    });

    it('omits the toggle when there are 2 or fewer cancer types', () => {
        const { queryByRole, container } = render(
            <OncoKbOccurrenceList
                total={6}
                cancerTypeCounts={SAMPLE_COUNTS.slice(0, 2)}
            />
        );
        assert.isNull(queryByRole('button'));
        assert.equal(container.querySelectorAll('.cancerType').length, 2);
    });

    it('right-aligns counts in the same order as the cancer types', () => {
        const { container } = render(
            <OncoKbOccurrenceList total={14} cancerTypeCounts={SAMPLE_COUNTS} />
        );
        const counts = Array.from(container.querySelectorAll('.count')).map(n =>
            normalize(n.textContent)
        );
        assert.deepEqual(counts, ['5', '3']);
    });
});

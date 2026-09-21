import { render } from '@testing-library/react';
import React from 'react';
import { assert } from 'chai';

import { OncoKbCardTitle } from './OncoKbCardTitle';

const TUMOR_TYPE = 'Breast Invasive Ductal Carcinoma';

function titleText(props: {
    hugoSymbol: string;
    proteinChange?: string;
    cDnaChange?: string;
    isGermline?: boolean;
}) {
    const { container } = render(
        <OncoKbCardTitle tumorType={TUMOR_TYPE} {...props} />
    );
    return container
        .querySelector('[data-test="oncokb-card-title"]')!
        .textContent!.replace('Germline', '')
        .trim();
}

describe('OncoKbCardTitle', () => {
    describe('protein changes', () => {
        it('prefixes a bare protein change with p.', () => {
            assert.equal(
                titleText({ hugoSymbol: 'BRAF', proteinChange: 'V600E' }),
                'BRAF p.V600E'
            );
        });

        it('leaves an already prefixed protein change alone', () => {
            assert.equal(
                titleText({ hugoSymbol: 'BRAF', proteinChange: 'p.V600E' }),
                'BRAF p.V600E'
            );
        });
    });

    // A structural variant's alteration is a complete label, not a protein
    // change: "BRCA1 p.BRCA1-SORCS2 Fusion" was the symptom of treating it as one.
    describe('structural variants', () => {
        it('does not prefix a fusion with p.', () => {
            assert.equal(
                titleText({
                    hugoSymbol: 'BRCA1',
                    proteinChange: 'BRCA1-SORCS2 Fusion',
                }),
                'BRCA1-SORCS2 Fusion'
            );
        });

        it('does not prefix an intragenic variant with p.', () => {
            assert.equal(
                titleText({
                    hugoSymbol: 'BRCA1',
                    proteinChange: 'BRCA1 intragenic',
                }),
                'BRCA1 intragenic'
            );
        });

        it('keeps the gene when the alteration does not name it', () => {
            assert.equal(
                titleText({ hugoSymbol: 'BRCA1', proteinChange: 'Fusion' }),
                'BRCA1 Fusion'
            );
        });

        it('renders a germline structural variant without parentheses', () => {
            assert.equal(
                titleText({
                    hugoSymbol: 'BRCA1',
                    proteinChange: 'BRCA1 intragenic',
                    isGermline: true,
                }),
                'BRCA1 intragenic'
            );
        });
    });

    describe('germline mutations', () => {
        it('shows the cDNA change with the protein change in parentheses', () => {
            assert.equal(
                titleText({
                    hugoSymbol: 'BRCA1',
                    cDnaChange: 'BRCA1:c.5266dupC',
                    proteinChange: 'Q1756fs',
                    isGermline: true,
                }),
                'BRCA1 c.5266dupC · (p.Q1756fs)'
            );
        });
    });
});

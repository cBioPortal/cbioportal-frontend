import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import FusionProductStrip, { stripExonIsAllUtr } from './FusionProductStrip';
import { TranscriptData } from '../data/types';

function tx(gene: string, strand: '+' | '-' = '+'): TranscriptData {
    return {
        transcriptId: gene,
        displayName: gene,
        gene,
        biotype: 'protein_coding',
        strand,
        txStart: 0,
        txEnd: 1000,
        exons: [
            { number: 1, start: 0, end: 100 },
            { number: 2, start: 200, end: 300 },
            { number: 3, start: 400, end: 500 },
        ],
        isForteSelected: true,
        domains: [],
        utrs: [],
    };
}

describe('FusionProductStrip', () => {
    it('renders retained exon rects for both partners', () => {
        const wrapper = mount(
            <svg>
                <FusionProductStrip
                    sampleId="S1"
                    label="S1"
                    transcript5p={tx('TMPRSS2')}
                    transcript3p={tx('ERG')}
                    breakpoint5p={250}
                    breakpoint3p={250}
                    frame="inFrame"
                    reads={12}
                    x={0}
                    y={0}
                    width={600}
                    alignment="junction"
                    junctionX={300}
                />
            </svg>
        );
        assert.isAtLeast(
            wrapper.find('[data-testid="strip-exon"]').hostNodes().length,
            2
        );
    });

    it('strip-active-outline has opacity 0 by default', () => {
        const wrapper = mount(
            <svg>
                <FusionProductStrip
                    sampleId="S1"
                    label="S1"
                    transcript5p={tx('TMPRSS2')}
                    transcript3p={tx('ERG')}
                    breakpoint5p={250}
                    breakpoint3p={250}
                    frame="inFrame"
                    reads={12}
                    x={0}
                    y={0}
                    width={600}
                    alignment="junction"
                    junctionX={300}
                />
            </svg>
        );
        const outline = wrapper
            .find('[data-testid="strip-active-outline"]')
            .hostNodes();
        assert.equal(outline.prop('opacity'), 0);
    });

    it('strip-active-outline has opacity 1 after mouseenter on product-strip', () => {
        const wrapper = mount(
            <svg>
                <FusionProductStrip
                    sampleId="S1"
                    label="S1"
                    transcript5p={tx('TMPRSS2')}
                    transcript3p={tx('ERG')}
                    breakpoint5p={250}
                    breakpoint3p={250}
                    frame="inFrame"
                    reads={12}
                    x={0}
                    y={0}
                    width={600}
                    alignment="junction"
                    junctionX={300}
                />
            </svg>
        );
        wrapper
            .find('[data-testid="product-strip"]')
            .hostNodes()
            .simulate('mouseenter');
        const outline = wrapper
            .find('[data-testid="strip-active-outline"]')
            .hostNodes();
        assert.equal(outline.prop('opacity'), 1);
    });
});

describe('stripExonIsAllUtr', () => {
    it('returns true when exon is fully covered by a five_prime UTR', () => {
        const exon = { start: 0, end: 100 };
        const utrs = [{ start: 0, end: 100, type: 'five_prime' as const }];
        assert.isTrue(stripExonIsAllUtr(exon, utrs));
    });

    it('returns false for a coding exon with no UTRs', () => {
        const exon = { start: 200, end: 300 };
        assert.isFalse(stripExonIsAllUtr(exon, []));
    });
});

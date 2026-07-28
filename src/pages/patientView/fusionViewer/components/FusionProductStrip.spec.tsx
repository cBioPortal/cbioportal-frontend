import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import FusionProductStrip, { stripExonIsAllUtr } from './FusionProductStrip';
import {
    exonsInOrder,
    computeJunctionAlignedLayout,
    genomicToExonX,
} from './fusionProductHelpers';
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
        isCallerSelected: true,
        isCanonical: true,
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
                    y={0}
                    leftX={170}
                    junctionX={400}
                    rightX={700}
                    pxPerBp5p={0.5}
                    pxPerBp3p={0.5}
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
                    y={0}
                    leftX={170}
                    junctionX={400}
                    rightX={700}
                    pxPerBp5p={0.5}
                    pxPerBp3p={0.5}
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
                    y={0}
                    leftX={170}
                    junctionX={400}
                    rightX={700}
                    pxPerBp5p={0.5}
                    pxPerBp3p={0.5}
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

    it('compact mode hides the label/reads text and exposes a hover <title>', () => {
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
                    y={0}
                    rowHeight={6}
                    compact
                    leftX={170}
                    junctionX={400}
                    rightX={700}
                    pxPerBp5p={0.5}
                    pxPerBp3p={0.5}
                />
            </svg>
        );
        // no visible <text> in compact mode
        assert.lengthOf(wrapper.find('text').hostNodes(), 0);
        // hover title carries sample · frame · reads
        assert.include(
            wrapper
                .find('title')
                .first()
                .text(),
            'S1'
        );
        assert.include(
            wrapper
                .find('title')
                .first()
                .text(),
            '12r'
        );
        // exons still drawn
        assert.isAtLeast(
            wrapper.find('[data-testid="strip-exon"]').hostNodes().length,
            2
        );
    });

    it('countLabel replaces the sample label in the left gutter', () => {
        const wrapper = mount(
            <svg>
                <FusionProductStrip
                    sampleId="S1"
                    label="S1"
                    countLabel="×412"
                    transcript5p={tx('TMPRSS2')}
                    transcript3p={tx('ERG')}
                    breakpoint5p={250}
                    breakpoint3p={250}
                    frame="inFrame"
                    reads={12}
                    y={0}
                    leftX={170}
                    junctionX={400}
                    rightX={700}
                    pxPerBp5p={0.5}
                    pxPerBp3p={0.5}
                />
            </svg>
        );
        const texts = wrapper.find('text').hostNodes();
        assert.isTrue(texts.someWhere((t: any) => t.text() === '×412'));
    });

    it('frameSummary renders an oncoprint-style frame cell', () => {
        const wrapper = mount(
            <svg>
                <FusionProductStrip
                    sampleId="S1"
                    label="S1"
                    frameSummary={{ inFrame: 3, outOfFrame: 1, unknown: 0 }}
                    transcript5p={tx('TMPRSS2')}
                    transcript3p={tx('ERG')}
                    breakpoint5p={250}
                    breakpoint3p={250}
                    frame="inFrame"
                    reads={12}
                    y={0}
                    leftX={170}
                    junctionX={400}
                    rightX={700}
                    pxPerBp5p={0.5}
                    pxPerBp3p={0.5}
                />
            </svg>
        );
        assert.lengthOf(
            wrapper.find('[data-testid="frame-cell"]').hostNodes(),
            1
        );
        assert.lengthOf(
            wrapper.find('[data-testid="frame-cell-inFrame"]').hostNodes(),
            1
        );
        assert.lengthOf(
            wrapper.find('[data-testid="frame-cell-outOfFrame"]').hostNodes(),
            1
        );
        // no unknown segment when its count is 0
        assert.lengthOf(
            wrapper.find('[data-testid="frame-cell-unknown"]').hostNodes(),
            0
        );
    });
});

describe('FusionProductStrip full exon mode', () => {
    function mountFull(props: any = {}) {
        return mount(
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
                    y={0}
                    leftX={170}
                    junctionX={400}
                    rightX={700}
                    pxPerBp5p={0.5}
                    pxPerBp3p={0.5}
                    exonMode="full"
                    {...props}
                />
            </svg>
        );
    }

    it('renders every exon of both transcripts', () => {
        // 3 exons per side, all drawn regardless of the breakpoint.
        assert.equal(
            mountFull()
                .find('[data-testid="strip-exon"]')
                .hostNodes().length,
            6
        );
    });

    it('marks the excluded exons as lost', () => {
        // 5' breakpoint 250 loses exon 3; 3' breakpoint 250 loses exon 1.
        assert.equal(
            mountFull()
                .find('[data-lost="true"]')
                .hostNodes().length,
            2
        );
    });

    it('fills lost exons with the neutral grey', () => {
        const lost = mountFull()
            .find('[data-lost="true"]')
            .hostNodes()
            .first();
        assert.equal(lost.prop('fill'), '#dee2e6');
    });

    it('draws a breakpoint tick per side instead of the junction seam', () => {
        assert.equal(
            mountFull()
                .find('[data-testid="strip-breakpoint-tick"]')
                .hostNodes().length,
            2
        );
    });

    it('retained mode is unchanged: only retained exons, no ticks', () => {
        const wrapper = mountFull({ exonMode: 'retained' });
        // breakpoint 250 retains 2 of 3 exons on each side.
        assert.equal(
            wrapper.find('[data-testid="strip-exon"]').hostNodes().length,
            4
        );
        assert.equal(wrapper.find('[data-lost="true"]').hostNodes().length, 0);
        assert.equal(
            wrapper.find('[data-testid="strip-breakpoint-tick"]').hostNodes()
                .length,
            0
        );
    });

    it('breakpoint tick x matches genomicToExonX independently, for each side, and is vertical', () => {
        // The two tick-rendering blocks in FusionProductStrip differ only in
        // their 5p/3p suffixes — recompute each expected x here from the same
        // helpers but independently, so a swapped xs/widths array is caught.
        const t5 = tx('TMPRSS2');
        const t3 = tx('ERG');
        const exons5p = exonsInOrder(t5);
        const exons3p = exonsInOrder(t3);
        const layout = computeJunctionAlignedLayout(
            exons5p,
            exons3p,
            170,
            400,
            700,
            0.5,
            0.5
        );
        const expected5 = genomicToExonX(
            250,
            exons5p,
            layout.xs5p,
            layout.widths5p,
            t5.strand
        );
        const expected3 = genomicToExonX(
            250,
            exons3p,
            layout.xs3p,
            layout.widths3p,
            t3.strand
        );

        const ticks = mountFull()
            .find('[data-testid="strip-breakpoint-tick"]')
            .hostNodes();
        const tick5 = ticks.at(0);
        const tick3 = ticks.at(1);

        assert.closeTo(Number(tick5.prop('x1')), expected5, 0.001);
        assert.equal(tick5.prop('x1'), tick5.prop('x2'));
        assert.closeTo(Number(tick3.prop('x1')), expected3, 0.001);
        assert.equal(tick3.prop('x1'), tick3.prop('x2'));
    });

    it('places the 5-prime tick correctly on a minus-strand transcript', () => {
        // Full mode's minus-strand path hasn't been exercised on the
        // component before — the helpers are tested on both strands, but not
        // this component combining them. Breakpoint 220 (not 250, the exon's
        // midpoint) is deliberately off-center within the 200-300 exon so the
        // plus- and minus-strand interpolations diverge — a symmetric
        // breakpoint would mask a wrong-strand argument.
        const t5 = tx('TMPRSS2', '-');
        const t3 = tx('ERG');
        const exons5p = exonsInOrder(t5);
        const exons3p = exonsInOrder(t3);
        const layout = computeJunctionAlignedLayout(
            exons5p,
            exons3p,
            170,
            400,
            700,
            0.5,
            0.5
        );
        const expected5 = genomicToExonX(
            220,
            exons5p,
            layout.xs5p,
            layout.widths5p,
            '-'
        );

        const tick5 = mountFull({ transcript5p: t5, breakpoint5p: 220 })
            .find('[data-testid="strip-breakpoint-tick"]')
            .hostNodes()
            .at(0);

        assert.closeTo(Number(tick5.prop('x1')), expected5, 0.001);
        assert.equal(tick5.prop('x1'), tick5.prop('x2'));
    });

    it('reports exon identity on hover', () => {
        let seen: any = null;
        const wrapper = mountFull({ onExonHover: (i: any) => (seen = i) });
        wrapper
            .find('[data-testid="strip-exon"]')
            .hostNodes()
            .first()
            .simulate('mouseenter', { clientX: 10, clientY: 20 });
        assert.equal(seen.gene, 'TMPRSS2');
        assert.equal(seen.exonNumber, 1);
        assert.equal(seen.retained, true);
        assert.equal(seen.sizeBp, 101);
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

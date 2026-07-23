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

describe('junction exon labels', () => {
    function renderStrip(junctionLabelMode: any, compact = false) {
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
                    compact={compact}
                    junctionLabelMode={junctionLabelMode}
                />
            </svg>
        );
    }

    it('inline-tooltip: draws an inline seam label in per-sample mode', () => {
        const w = renderStrip('inline-tooltip', false);
        const label = w.find('[data-testid="junction-label"]').hostNodes();
        assert.equal(label.length, 1);
        assert.equal(label.text(), 'E2|E2');
    });

    it('inline-tooltip: no inline label in dense mode (folds into title)', () => {
        const w = renderStrip('inline-tooltip', true);
        assert.equal(
            w.find('[data-testid="junction-label"]').hostNodes().length,
            0
        );
        assert.include(w.find('title').text(), 'E2→E2');
    });

    it('inline-both: draws the inline seam label even in dense mode', () => {
        const w = renderStrip('inline-both', true);
        assert.equal(
            w.find('[data-testid="junction-label"]').hostNodes().length,
            1
        );
    });

    it('gutter: draws the label in the right gutter, not at the seam', () => {
        const w = renderStrip('gutter', false);
        assert.equal(
            w.find('[data-testid="junction-gutter"]').hostNodes().length,
            1
        );
        assert.equal(
            w.find('[data-testid="junction-label"]').hostNodes().length,
            0
        );
    });

    it('gutter mode + collapsed frame cell coexist without colliding', () => {
        // Collapsed mode passes frameSummary (frame cell in the right gutter).
        // With junctionLabelMode="gutter" the junction label also lands in the
        // right gutter — assert both render and the label sits below the frame
        // cell (no vertical overlap).
        const w = mount(
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
                    rowHeight={50}
                    leftX={170}
                    junctionX={400}
                    rightX={700}
                    pxPerBp5p={0.5}
                    pxPerBp3p={0.5}
                    junctionLabelMode="gutter"
                    frameSummary={{ inFrame: 3, outOfFrame: 0, unknown: 0 }}
                />
            </svg>
        );
        const gutter = w.find('[data-testid="junction-gutter"]').hostNodes();
        const frameRect = w
            .find('[data-testid="frame-cell-inFrame"]')
            .hostNodes();
        // Both are present — neither suppresses the other.
        assert.equal(gutter.length, 1);
        assert.equal(frameRect.length, 1);
        // Gutter label baseline sits below the frame cell's bottom edge.
        const frameBottom =
            (frameRect.prop('y') as number) +
            (frameRect.prop('height') as number);
        assert.isAbove(gutter.prop('y') as number, frameBottom);
    });

    it('single-gene event shows only the 5′ exon', () => {
        const w = mount(
            <svg>
                <FusionProductStrip
                    sampleId="S1"
                    label="S1"
                    transcript5p={tx('TMPRSS2')}
                    breakpoint5p={250}
                    frame="unknown"
                    reads={3}
                    y={0}
                    leftX={170}
                    junctionX={400}
                    rightX={700}
                    pxPerBp5p={0.5}
                    pxPerBp3p={0.5}
                    junctionLabelMode="inline-tooltip"
                />
            </svg>
        );
        assert.equal(
            w
                .find('[data-testid="junction-label"]')
                .hostNodes()
                .text(),
            'E2'
        );
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

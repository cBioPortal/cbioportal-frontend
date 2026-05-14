import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import {
    computeRetainedShadeX,
    getGeneTrackHeight,
    GeneTrack,
} from './GeneTrack';
import { TranscriptData } from '../data/types';

describe('computeRetainedShadeX', () => {
    // 5′ gene + strand → shade LEFT (start <= bp)
    describe('5-prime gene, + strand (shade left)', () => {
        it('returns x=drawX and width=bpX-drawX', () => {
            const result = computeRetainedShadeX('+', true, 180, 20, 300);
            assert.equal(result.x, 20);
            assert.equal(result.width, 160);
        });

        it('clamps to 0 when breakpoint is left of drawX', () => {
            const result = computeRetainedShadeX('+', true, 10, 20, 300);
            assert.equal(result.x, 20);
            assert.equal(result.width, 0);
        });

        it('caps at drawWidth when breakpoint is right of track end', () => {
            const result = computeRetainedShadeX('+', true, 400, 20, 300);
            assert.equal(result.x, 20);
            assert.equal(result.width, 300);
        });
    });

    // 5′ gene − strand → shade RIGHT (end >= bp)
    describe('5-prime gene, - strand (shade right)', () => {
        it('returns x=bpX and width from bpX to track end', () => {
            const result = computeRetainedShadeX('-', true, 180, 20, 300);
            assert.equal(result.x, 180);
            assert.equal(result.width, 140); // (20 + 300) - 180
        });

        it('clamps to 0 when breakpoint is right of track end', () => {
            const result = computeRetainedShadeX('-', true, 400, 20, 300);
            assert.equal(result.width, 0);
        });

        it('returns full width when breakpoint is left of drawX', () => {
            const result = computeRetainedShadeX('-', true, 10, 20, 300);
            assert.equal(result.x, 20); // clamped to drawX
            assert.equal(result.width, 300); // (20 + 300) - 20
        });
    });

    // 3′ gene + strand → shade RIGHT (end >= bp) — opposite of 5′/+ strand
    describe('3-prime gene, + strand (shade right)', () => {
        it('returns x=bpX and width from bpX to track end', () => {
            const result = computeRetainedShadeX('+', false, 180, 20, 300);
            assert.equal(result.x, 180);
            assert.equal(result.width, 140);
        });

        it('clamps to 0 when breakpoint is right of track end', () => {
            const result = computeRetainedShadeX('+', false, 400, 20, 300);
            assert.equal(result.width, 0);
        });
    });

    // 3′ gene − strand → shade LEFT (start <= bp) — opposite of 5′/− strand
    describe('3-prime gene, - strand (shade left)', () => {
        it('returns x=drawX and width=bpX-drawX', () => {
            const result = computeRetainedShadeX('-', false, 180, 20, 300);
            assert.equal(result.x, 20);
            assert.equal(result.width, 160);
        });

        it('clamps to 0 when breakpoint is left of drawX', () => {
            const result = computeRetainedShadeX('-', false, 10, 20, 300);
            assert.equal(result.x, 20);
            assert.equal(result.width, 0);
        });
    });
});

// ---------------------------------------------------------------------------
// Direction-cue rendering tests (cues B chevrons, C 5′/3′ caps, D label arrow
// + TRANSCRIBED pill). See spec:
// docs/superpowers/specs/2026-05-14-gene-direction-cues-design.md
// ---------------------------------------------------------------------------

const GENE_COLOR = '#1864ab';

function makeTranscript(
    overrides: Partial<TranscriptData> = {}
): TranscriptData {
    return {
        transcriptId: 'ENST_DEFAULT',
        displayName: 'ENST_DEFAULT',
        gene: 'GENE_A',
        biotype: 'protein_coding',
        strand: '+' as const,
        txStart: 100,
        txEnd: 500,
        exons: [
            { number: 1, start: 100, end: 200 },
            { number: 2, start: 300, end: 400 },
        ],
        isForteSelected: false,
        domains: [],
        ...overrides,
    };
}

function renderGeneTrack(strand: '+' | '-') {
    const forte = makeTranscript({
        transcriptId: 'ENST_FORTE',
        isForteSelected: true,
        strand,
    });
    return mount(
        <svg>
            <GeneTrack
                symbol="GENE_A"
                chromosome="1"
                position={250}
                strand={strand}
                siteDescription=""
                forteTranscript={forte}
                color={GENE_COLOR}
                x={0}
                y={0}
                width={400}
                is5Prime={true}
            />
        </svg>
    );
}

describe('GeneTrack — direction cue D: label arrow upsize', () => {
    it('renders the strand <tspan> with the gene color and font-size 13', () => {
        const wrapper = renderGeneTrack('+');
        const tspans = wrapper.find('tspan');
        assert.isAtLeast(tspans.length, 1);
        const tspan = tspans.first();
        assert.equal(tspan.prop('fill'), GENE_COLOR);
        assert.equal(String(tspan.prop('fontSize')), '13');
    });
});

describe('GeneTrack — direction cue D: TRANSCRIBED pill', () => {
    it('plus strand renders "TRANSCRIBED ▶"', () => {
        const wrapper = renderGeneTrack('+');
        const text = wrapper.text();
        assert.match(text, /TRANSCRIBED\s*▶/);
    });

    it('minus strand renders "◀ TRANSCRIBED"', () => {
        const wrapper = renderGeneTrack('-');
        const text = wrapper.text();
        assert.match(text, /◀\s*TRANSCRIBED/);
    });

    it('pill stroke matches the gene color prop', () => {
        const wrapper = renderGeneTrack('+');
        // The pill is a <rect> with rx=7, fill = color + '1A', stroke = color
        const pillRect = wrapper
            .find('rect')
            .findWhere(
                n =>
                    n.type() === 'rect' &&
                    n.prop('rx') === 7 &&
                    n.prop('stroke') === GENE_COLOR
            );
        assert.isAtLeast(pillRect.length, 1);
    });
});

describe('GeneTrack — direction cue C: 5′ / 3′ end caps', () => {
    it('plus strand puts "5′" on the left (smaller x) than "3′"', () => {
        const wrapper = renderGeneTrack('+');
        const texts = wrapper.findWhere(
            n => n.type() === 'text' && (n.text() === '5′' || n.text() === '3′')
        );
        const fivePrime = texts.findWhere(n => n.text() === '5′').first();
        const threePrime = texts.findWhere(n => n.text() === '3′').first();
        assert.isAtLeast(fivePrime.length, 1);
        assert.isAtLeast(threePrime.length, 1);
        assert.isBelow(
            Number(fivePrime.prop('x')),
            Number(threePrime.prop('x'))
        );
    });

    it('minus strand puts "5′" on the right (larger x) than "3′"', () => {
        const wrapper = renderGeneTrack('-');
        const texts = wrapper.findWhere(
            n => n.type() === 'text' && (n.text() === '5′' || n.text() === '3′')
        );
        const fivePrime = texts.findWhere(n => n.text() === '5′').first();
        const threePrime = texts.findWhere(n => n.text() === '3′').first();
        assert.isAtLeast(fivePrime.length, 1);
        assert.isAtLeast(threePrime.length, 1);
        assert.isAbove(
            Number(fivePrime.prop('x')),
            Number(threePrime.prop('x'))
        );
    });
});

describe('GeneTrack — direction cue B: intron-line chevrons', () => {
    function chevronPoints(wrapper: ReturnType<typeof renderGeneTrack>) {
        return wrapper
            .find('polyline')
            .map(n => String(n.prop('points')))
            .map(p => {
                const triples = p.trim().split(/\s+/);
                // Three "x,y" pairs. Base (tail) is the doubled X (first and
                // third triple share the same X); tip is the middle triple.
                const xs = triples.map(t => Number(t.split(',')[0]));
                return { baseX: xs[0], tipX: xs[1], tailX: xs[2] };
            });
    }

    it('plus strand: every chevron tip X is greater than its base X', () => {
        const wrapper = renderGeneTrack('+');
        const chevs = chevronPoints(wrapper);
        assert.isAtLeast(chevs.length, 1);
        chevs.forEach(c => {
            assert.isAbove(c.tipX, c.baseX);
            assert.equal(c.baseX, c.tailX);
        });
    });

    it('minus strand: every chevron tip X is less than its base X', () => {
        const wrapper = renderGeneTrack('-');
        const chevs = chevronPoints(wrapper);
        assert.isAtLeast(chevs.length, 1);
        chevs.forEach(c => {
            assert.isBelow(c.tipX, c.baseX);
            assert.equal(c.baseX, c.tailX);
        });
    });

    it('no chevron midpoint falls inside any exon [start-2, end+2] range', () => {
        const wrapper = renderGeneTrack('+');
        // Test exons are 100-200 and 300-400 in genomic coords.
        // toSvg maps gMin..gMax to drawX..drawX+drawWidth (10..390).
        // Skip rule operates on SVG-space exon ranges. Just verify that
        // every emitted chevron's midpoint avoids the SVG-space exon
        // projections (with 2 px padding).
        const polylines = wrapper.find('polyline');
        const midpoints = polylines.map(n => {
            const triples = String(n.prop('points'))
                .trim()
                .split(/\s+/);
            const xs = triples.map(t => Number(t.split(',')[0]));
            // SVG midpoint of the chevron = x + 3 (CHEVRON_WIDTH/2)
            return Math.min(...xs) + 3;
        });
        // Recompute exon SVG ranges using the same formula as the component.
        const gMin = 100 - Math.round((400 - 100) * 0.03);
        const gMax = 400 + Math.round((400 - 100) * 0.03);
        const drawX = 10;
        const drawWidth = 380;
        const toSvg = (g: number) =>
            drawX + ((g - gMin) / (gMax - gMin)) * drawWidth;
        const exonRanges = [
            { lo: toSvg(100) - 2, hi: toSvg(200) + 2 },
            { lo: toSvg(300) - 2, hi: toSvg(400) + 2 },
        ];
        midpoints.forEach(m => {
            exonRanges.forEach(r => {
                assert.isFalse(
                    m >= r.lo && m <= r.hi,
                    `midpoint ${m} fell inside exon range [${r.lo}, ${r.hi}]`
                );
            });
        });
    });
});

describe('GeneTrack — layout invariants', () => {
    it('getGeneTrackHeight returns unchanged values after the cue redesign', () => {
        // These hardcoded numbers match the component constants
        // (LABEL_HEIGHT=36, FORTE_TRACK_HEIGHT=48, USER_TRACK_HEIGHT=42,
        // BREAKPOINT_EXTRA=20) and must not drift when adding direction cues.
        assert.equal(getGeneTrackHeight(true, 1), 36 + 48 + 42 + 20);
        assert.equal(getGeneTrackHeight(true, 3), 36 + 48 + 3 * 42 + 20);
    });
});

import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import {
    computeRetainedShadeX,
    getGeneTrackHeight,
    GeneTrack,
    splitExonByFivePrimeUtr,
    applyUpstreamExtension,
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
        utrs: [],
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

describe('GeneTrack — direction cue D: strand label', () => {
    it('renders the strand <tspan> with the gene color and font-size 11', () => {
        const wrapper = renderGeneTrack('+');
        const tspans = wrapper.find('tspan');
        assert.isAtLeast(tspans.length, 1);
        const tspan = tspans.first();
        assert.equal(tspan.prop('fill'), GENE_COLOR);
        assert.equal(String(tspan.prop('fontSize')), '11');
    });

    it('plus strand renders "(+)" next to gene symbol', () => {
        const wrapper = renderGeneTrack('+');
        const text = wrapper.text();
        assert.include(text, '(+)');
    });

    it('minus strand renders "(-)" next to gene symbol', () => {
        const wrapper = renderGeneTrack('-');
        const text = wrapper.text();
        assert.include(text, '(-)');
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

describe('GeneTrack — direction cue A: TSS arrow', () => {
    it('plus strand: renders a tss-arrow polyline for the FORTE transcript', () => {
        const wrapper = renderGeneTrack('+');
        const arrow = wrapper.find('[data-testid="tss-arrow-ENST_FORTE"]');
        assert.equal(arrow.length, 1);
    });

    it('minus strand: renders a tss-arrow polyline for the FORTE transcript', () => {
        const wrapper = renderGeneTrack('-');
        const arrow = wrapper.find('[data-testid="tss-arrow-ENST_FORTE"]');
        assert.equal(arrow.length, 1);
    });

    it('plus strand: arrow points to the right (horizontal segment goes right)', () => {
        const wrapper = renderGeneTrack('+');
        const arrow = wrapper.find('[data-testid="tss-arrow-ENST_FORTE"]');
        const pts = String(arrow.prop('points'))
            .trim()
            .split(/\s+/)
            .map(t => Number(t.split(',')[0]));
        // Points[0] = tssX (vertical leg base), Points[2] = tssX + 10 (horizontal tip)
        // On + strand the horizontal tip X must be greater than the TSS X.
        assert.isAbove(pts[2], pts[0]);
    });

    it('minus strand: arrow points to the left (horizontal segment goes left)', () => {
        const wrapper = renderGeneTrack('-');
        const arrow = wrapper.find('[data-testid="tss-arrow-ENST_FORTE"]');
        const pts = String(arrow.prop('points'))
            .trim()
            .split(/\s+/)
            .map(t => Number(t.split(',')[0]));
        // On - strand the horizontal tip X must be less than the TSS X.
        assert.isBelow(pts[2], pts[0]);
    });

    it('showPromoter=false: no tss-arrow polyline rendered', () => {
        const forte = makeTranscript({
            transcriptId: 'ENST_FORTE',
            isForteSelected: true,
            strand: '+',
        });
        const wrapper = mount(
            <svg>
                <GeneTrack
                    symbol="GENE_A"
                    chromosome="1"
                    position={250}
                    strand="+"
                    siteDescription=""
                    forteTranscript={forte}
                    color={GENE_COLOR}
                    x={0}
                    y={0}
                    width={400}
                    is5Prime={true}
                    showPromoter={false}
                />
            </svg>
        );
        const arrow = wrapper.find('[data-testid="tss-arrow-ENST_FORTE"]');
        assert.equal(arrow.length, 0);
    });

    it('user transcript also gets a tss-arrow', () => {
        const forte = makeTranscript({
            transcriptId: 'ENST_FORTE',
            isForteSelected: true,
            strand: '+',
        });
        const user = makeTranscript({
            transcriptId: 'ENST_USER',
            isForteSelected: false,
            strand: '+',
        });
        const wrapper = mount(
            <svg>
                <GeneTrack
                    symbol="GENE_A"
                    chromosome="1"
                    position={250}
                    strand="+"
                    siteDescription=""
                    forteTranscript={forte}
                    userTranscripts={[user]}
                    color={GENE_COLOR}
                    x={0}
                    y={0}
                    width={400}
                    is5Prime={true}
                    showPromoter={true}
                />
            </svg>
        );
        assert.equal(
            wrapper.find('[data-testid="tss-arrow-ENST_FORTE"]').length,
            1
        );
        assert.equal(
            wrapper.find('[data-testid="tss-arrow-ENST_USER"]').length,
            1
        );
    });
});

describe('GeneTrack — direction cue B: intron-line chevrons', () => {
    function chevronPoints(wrapper: ReturnType<typeof renderGeneTrack>) {
        return (
            wrapper
                .find('polyline')
                // Exclude TSS arrows — they have a data-testid starting with "tss-arrow"
                .filterWhere(
                    n =>
                        !String(n.prop('data-testid') ?? '').startsWith(
                            'tss-arrow'
                        )
                )
                .map(n => String(n.prop('points')))
                .map(p => {
                    const triples = p.trim().split(/\s+/);
                    // Three "x,y" pairs. Base (tail) is the doubled X (first and
                    // third triple share the same X); tip is the middle triple.
                    const xs = triples.map(t => Number(t.split(',')[0]));
                    return { baseX: xs[0], tipX: xs[1], tailX: xs[2] };
                })
        );
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
        // Exclude TSS arrows — they aren't chevrons
        const polylines = wrapper
            .find('polyline')
            .filterWhere(
                n =>
                    !String(n.prop('data-testid') ?? '').startsWith('tss-arrow')
            );
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

// ---------------------------------------------------------------------------
// Helper unit tests for splitExonByFivePrimeUtr
// ---------------------------------------------------------------------------

describe('splitExonByFivePrimeUtr', () => {
    const exon = { start: 100, end: 300 };

    it('returns single non-UTR segment when no UTRs present', () => {
        const segs = splitExonByFivePrimeUtr(exon, []);
        assert.deepEqual(segs, [{ start: 100, end: 300, isUtr: false }]);
    });

    it('returns single UTR segment when exon is entirely inside a 5′ UTR', () => {
        const segs = splitExonByFivePrimeUtr(exon, [
            { start: 50, end: 400, type: 'five_prime' },
        ]);
        assert.equal(segs.length, 1);
        assert.equal(segs[0].isUtr, true);
        assert.equal(segs[0].start, 100);
        assert.equal(segs[0].end, 300);
    });

    it('splits at UTR/CDS boundary — two adjacent segments', () => {
        // UTR covers 100-199, CDS covers 200-300
        const segs = splitExonByFivePrimeUtr(exon, [
            { start: 100, end: 199, type: 'five_prime' },
        ]);
        assert.equal(segs.length, 2);
        // First segment: the UTR portion
        assert.equal(segs[0].start, 100);
        assert.equal(segs[0].end, 199);
        assert.equal(segs[0].isUtr, true);
        // Second segment: the CDS portion
        assert.equal(segs[1].start, 200);
        assert.equal(segs[1].end, 300);
        assert.equal(segs[1].isUtr, false);
    });

    it('mid-exon UTR produces CDS|UTR|CDS — three segments', () => {
        // UTR is in the middle: 150-200
        const segs = splitExonByFivePrimeUtr(exon, [
            { start: 150, end: 200, type: 'five_prime' },
        ]);
        assert.equal(segs.length, 3);
        assert.equal(segs[0].isUtr, false); // pre-UTR CDS
        assert.equal(segs[1].isUtr, true); // UTR
        assert.equal(segs[2].isUtr, false); // post-UTR CDS
        // Check adjacency
        assert.equal(segs[0].end + 1, segs[1].start);
        assert.equal(segs[1].end + 1, segs[2].start);
    });

    it('multiple non-overlapping UTRs produce alternating CDS/UTR segments', () => {
        // Two UTR islands: 110-130 and 160-180
        const segs = splitExonByFivePrimeUtr(exon, [
            { start: 110, end: 130, type: 'five_prime' },
            { start: 160, end: 180, type: 'five_prime' },
        ]);
        // Expected: CDS[100-109] UTR[110-130] CDS[131-159] UTR[160-180] CDS[181-300]
        assert.equal(segs.length, 5);
        const utrFlags = segs.map(s => s.isUtr);
        assert.deepEqual(utrFlags, [false, true, false, true, false]);
    });

    it('ignores 3′ UTRs — exon renders as single non-UTR segment', () => {
        const segs = splitExonByFivePrimeUtr(exon, [
            { start: 100, end: 300, type: 'three_prime' },
        ]);
        assert.deepEqual(segs, [{ start: 100, end: 300, isUtr: false }]);
    });

    it('ignores 3′ UTR when mixed with 5′ UTR — only 5′ splits', () => {
        // 5′ UTR: 100-150, 3′ UTR: 200-300 — only 5′ should split
        const segs = splitExonByFivePrimeUtr(exon, [
            { start: 100, end: 150, type: 'five_prime' },
            { start: 200, end: 300, type: 'three_prime' },
        ]);
        assert.equal(segs.length, 2);
        assert.equal(segs[0].isUtr, true);
        assert.equal(segs[1].isUtr, false);
    });
});

// ---------------------------------------------------------------------------
// Cue B — UTR half-height rendering integration tests
// ---------------------------------------------------------------------------

/**
 * Build a GeneTrack with custom props and mount it. Provides full control
 * over transcriptId, strand, utrs, is5Prime, showPromoter, and activeTranscriptId.
 */
function mountGeneTrack(opts: {
    strand?: '+' | '-';
    is5Prime?: boolean;
    showPromoter?: boolean;
    utrs?: TranscriptData['utrs'];
    activeTranscriptId?: string;
    exons?: TranscriptData['exons'];
    txStart?: number;
    txEnd?: number;
}) {
    const {
        strand = '+',
        is5Prime = true,
        showPromoter = true,
        utrs = [],
        activeTranscriptId,
        exons = [
            { number: 1, start: 100, end: 300 },
            { number: 2, start: 500, end: 700 },
        ],
        txStart = 100,
        txEnd = 700,
    } = opts;

    const forte = makeTranscript({
        transcriptId: 'ENST_FORTE',
        isForteSelected: true,
        strand,
        exons,
        utrs,
        txStart,
        txEnd,
    });

    return mount(
        <svg>
            <GeneTrack
                symbol="GENE_A"
                chromosome="1"
                position={400}
                strand={strand}
                siteDescription=""
                forteTranscript={forte}
                color={GENE_COLOR}
                x={0}
                y={0}
                width={400}
                is5Prime={is5Prime}
                showPromoter={showPromoter}
                activeTranscriptId={activeTranscriptId}
            />
        </svg>
    );
}

describe('GeneTrack — cue B: UTR half-height rendering', () => {
    const EXON_HEIGHT = 12;

    it('single 5′-UTR-only exon renders half-height', () => {
        // Exon entirely covered by a 5′ UTR
        const wrapper = mountGeneTrack({
            exons: [{ number: 1, start: 100, end: 300 }],
            utrs: [{ start: 50, end: 400, type: 'five_prime' }],
        });
        const utrRects = wrapper.find('[data-testid="exon-utr-rect"]');
        assert.isAtLeast(utrRects.length, 1);
        // All UTR rects must be half-height
        utrRects.forEach(r => {
            assert.equal(Number(r.prop('height')), EXON_HEIGHT / 2);
        });
    });

    it('no UTR — all exon rects are full-height, no half-height rects', () => {
        const wrapper = mountGeneTrack({ utrs: [] });
        // No UTR rects at all
        assert.equal(wrapper.find('[data-testid="exon-utr-rect"]').length, 0);
        // All CDS rects are full height
        const cdsRects = wrapper.find('[data-testid="exon-cds-rect"]');
        assert.isAtLeast(cdsRects.length, 1);
        cdsRects.forEach(r => {
            assert.equal(Number(r.prop('height')), EXON_HEIGHT);
        });
    });

    it('mid-exon UTR/CDS split emits both a half-height (UTR) and full-height (CDS) rect', () => {
        // Exon 100-500; UTR covers 100-250, CDS covers 251-500
        const wrapper = mountGeneTrack({
            exons: [{ number: 1, start: 100, end: 500 }],
            utrs: [{ start: 100, end: 250, type: 'five_prime' }],
        });
        const utrRects = wrapper.find('[data-testid="exon-utr-rect"]');
        const cdsRects = wrapper.find('[data-testid="exon-cds-rect"]');
        assert.isAtLeast(utrRects.length, 1, 'expected at least one UTR rect');
        assert.isAtLeast(cdsRects.length, 1, 'expected at least one CDS rect');
        // UTR rect is half height, CDS rect is full height
        assert.equal(Number(utrRects.first().prop('height')), EXON_HEIGHT / 2);
        assert.equal(Number(cdsRects.first().prop('height')), EXON_HEIGHT);
    });

    it('3′ UTR is ignored — exon renders as a single full-height CDS rect', () => {
        const wrapper = mountGeneTrack({
            exons: [{ number: 1, start: 100, end: 300 }],
            utrs: [{ start: 100, end: 300, type: 'three_prime' }],
        });
        assert.equal(wrapper.find('[data-testid="exon-utr-rect"]').length, 0);
        const cdsRects = wrapper.find('[data-testid="exon-cds-rect"]');
        assert.isAtLeast(cdsRects.length, 1);
        cdsRects.forEach(r => {
            assert.equal(Number(r.prop('height')), EXON_HEIGHT);
        });
    });

    it('UTR half-height is independent of showPromoter toggle', () => {
        // showPromoter=false should NOT suppress the UTR height split
        const wrapper = mountGeneTrack({
            exons: [{ number: 1, start: 100, end: 300 }],
            utrs: [{ start: 50, end: 400, type: 'five_prime' }],
            showPromoter: false,
        });
        const utrRects = wrapper.find('[data-testid="exon-utr-rect"]');
        assert.isAtLeast(utrRects.length, 1);
        utrRects.forEach(r => {
            assert.equal(Number(r.prop('height')), EXON_HEIGHT / 2);
        });
    });
});

// ---------------------------------------------------------------------------
// Cue C — upstream promoter tint integration tests
// ---------------------------------------------------------------------------

/**
 * Compute the expected upstream window (bp) for a given gene span.
 * Mirrors the formula in applyUpstreamExtension.
 */
function expectedUpstreamWindow(geneSpan: number): number {
    return Math.min(2000, 0.05 * geneSpan);
}

describe('GeneTrack — cue C: upstream promoter tint', () => {
    it('renders a promoter-tint rect when is5Prime=true, showPromoter=true, activeTranscriptId set', () => {
        const wrapper = mountGeneTrack({
            strand: '+',
            is5Prime: true,
            showPromoter: true,
            activeTranscriptId: 'ENST_FORTE',
        });
        assert.equal(wrapper.find('[data-testid="promoter-tint"]').length, 1);
    });

    it('no tint rect when is5Prime=false', () => {
        const wrapper = mountGeneTrack({
            strand: '+',
            is5Prime: false,
            showPromoter: true,
            activeTranscriptId: 'ENST_FORTE',
        });
        assert.equal(wrapper.find('[data-testid="promoter-tint"]').length, 0);
    });

    it('no tint rect when showPromoter=false', () => {
        const wrapper = mountGeneTrack({
            strand: '+',
            is5Prime: true,
            showPromoter: false,
            activeTranscriptId: 'ENST_FORTE',
        });
        assert.equal(wrapper.find('[data-testid="promoter-tint"]').length, 0);
    });

    it('no tint rect when activeTranscriptId is not set', () => {
        // tint requires an active transcript to anchor to
        const wrapper = mountGeneTrack({
            strand: '+',
            is5Prime: true,
            showPromoter: true,
            activeTranscriptId: undefined,
        });
        assert.equal(wrapper.find('[data-testid="promoter-tint"]').length, 0);
    });

    it('+ strand: tint right edge (x + width) aligns with the active TSS pixel position', () => {
        // Exons: 1000-2000 and 3000-4000; txStart=1000, breakpoint at 2500
        const exons = [
            { number: 1, start: 1000, end: 2000 },
            { number: 2, start: 3000, end: 4000 },
        ];
        const txStart = 1000;
        const txEnd = 4000;
        const wrapper = mount(
            <svg>
                <GeneTrack
                    symbol="GENE_A"
                    chromosome="1"
                    position={2500}
                    strand="+"
                    siteDescription=""
                    forteTranscript={makeTranscript({
                        transcriptId: 'ENST_FORTE',
                        isForteSelected: true,
                        strand: '+',
                        exons,
                        txStart,
                        txEnd,
                        utrs: [],
                    })}
                    color={GENE_COLOR}
                    x={0}
                    y={0}
                    width={400}
                    is5Prime={true}
                    showPromoter={true}
                    activeTranscriptId="ENST_FORTE"
                />
            </svg>
        );
        const tint = wrapper.find('[data-testid="promoter-tint"]');
        assert.equal(tint.length, 1);
        const tintX = Number(tint.prop('x'));
        const tintW = Number(tint.prop('width'));
        const tintRight = tintX + tintW;

        // Manually compute the TSS SVG position using the same logic as the component
        const geneSpan = txEnd - txStart; // 3000
        const upstreamWindow = expectedUpstreamWindow(geneSpan); // min(2000, 150) = 150
        // gMin/gMax from computeGeneTrackRange then applyUpstreamExtension:
        const allStarts = exons.map(e => e.start);
        const allEnds = exons.map(e => e.end);
        const breakpointPos = 2500;
        const genomeMin = Math.min(...allStarts, breakpointPos); // 1000
        const genomeMax = Math.max(...allEnds, breakpointPos); // 4000
        const padBp = Math.max(1, Math.round((genomeMax - genomeMin) * 0.03)); // round(90)=90
        const gMinBase = genomeMin - padBp;
        const gMaxBase = genomeMax + padBp;
        const gMin = Math.min(gMinBase, txStart - upstreamWindow);
        const gMax = gMaxBase;
        const TRACK_PADDING = 10;
        const drawX = TRACK_PADDING;
        const drawWidth = 400 - TRACK_PADDING * 2;
        const toSvg = (g: number) =>
            drawX + ((g - gMin) / (gMax - gMin)) * drawWidth;
        const expectedTssX = toSvg(txStart);

        assert.approximately(tintRight, expectedTssX, 1);
    });

    it('tint width ratio ~ upstreamWindow / (geneSpan + upstreamWindow) for small gene span', () => {
        // geneSpan ~1000 bp → upstreamWindow = min(2000, 50) = 50
        const exons = [
            { number: 1, start: 1000, end: 1500 },
            { number: 2, start: 1700, end: 2000 },
        ];
        const txStart = 1000;
        const txEnd = 2000;
        const geneSpan = txEnd - txStart; // 1000
        const upstreamWindow = expectedUpstreamWindow(geneSpan); // 50
        assert.equal(
            upstreamWindow,
            50,
            'sanity: upstreamWindow should be 50 for 1000bp gene'
        );

        const wrapper = mount(
            <svg>
                <GeneTrack
                    symbol="GENE_A"
                    chromosome="1"
                    position={1750}
                    strand="+"
                    siteDescription=""
                    forteTranscript={makeTranscript({
                        transcriptId: 'ENST_FORTE',
                        isForteSelected: true,
                        strand: '+',
                        exons,
                        txStart,
                        txEnd,
                        utrs: [],
                    })}
                    color={GENE_COLOR}
                    x={0}
                    y={0}
                    width={400}
                    is5Prime={true}
                    showPromoter={true}
                    activeTranscriptId="ENST_FORTE"
                />
            </svg>
        );
        const tint = wrapper.find('[data-testid="promoter-tint"]');
        assert.equal(tint.length, 1);
        const tintW = Number(tint.prop('width'));

        // Compute the drawable region
        const TRACK_PADDING = 10;
        const drawWidth = 400 - TRACK_PADDING * 2; // 380

        // The tint spans exactly upstreamWindow bp in genomic space.
        // The total rendered span (gMax - gMin) includes padding + upstreamWindow.
        // Compute gMin/gMax the same way the component does:
        const breakpointPos = 1750;
        const genomeMin = Math.min(txStart, breakpointPos); // 1000
        const genomeMax = Math.max(txEnd, breakpointPos); // 2000
        const padBp = Math.max(1, Math.round((genomeMax - genomeMin) * 0.03)); // 30
        const gMinBase = genomeMin - padBp;
        const gMaxBase = genomeMax + padBp;
        const gMin = Math.min(gMinBase, txStart - upstreamWindow);
        const gMax = gMaxBase;
        const totalBp = gMax - gMin;
        const expectedTintW = (upstreamWindow / totalBp) * drawWidth;

        assert.approximately(tintW, expectedTintW, 2);
    });

    it('tint width ratio uses 2000bp upstreamWindow for large gene span (100 000 bp)', () => {
        // geneSpan = 100 000 → upstreamWindow = min(2000, 5000) = 2000
        const exons = [
            { number: 1, start: 0, end: 50000 },
            { number: 2, start: 70000, end: 100000 },
        ];
        const txStart = 0;
        const txEnd = 100000;
        const geneSpan = txEnd - txStart; // 100000
        const upstreamWindow = expectedUpstreamWindow(geneSpan); // 2000
        assert.equal(
            upstreamWindow,
            2000,
            'sanity: upstreamWindow should be 2000 for 100000bp gene'
        );

        const wrapper = mount(
            <svg>
                <GeneTrack
                    symbol="GENE_A"
                    chromosome="1"
                    position={50000}
                    strand="+"
                    siteDescription=""
                    forteTranscript={makeTranscript({
                        transcriptId: 'ENST_FORTE',
                        isForteSelected: true,
                        strand: '+',
                        exons,
                        txStart,
                        txEnd,
                        utrs: [],
                    })}
                    color={GENE_COLOR}
                    x={0}
                    y={0}
                    width={400}
                    is5Prime={true}
                    showPromoter={true}
                    activeTranscriptId="ENST_FORTE"
                />
            </svg>
        );
        const tint = wrapper.find('[data-testid="promoter-tint"]');
        assert.equal(tint.length, 1);
        const tintW = Number(tint.prop('width'));

        const TRACK_PADDING = 10;
        const drawWidth = 400 - TRACK_PADDING * 2; // 380
        const breakpointPos = 50000;
        const genomeMin = Math.min(txStart, breakpointPos); // 0
        const genomeMax = Math.max(txEnd, breakpointPos); // 100000
        const padBp = Math.max(1, Math.round((genomeMax - genomeMin) * 0.03)); // 3000
        const gMinBase = genomeMin - padBp;
        const gMaxBase = genomeMax + padBp;
        const gMin = Math.min(gMinBase, txStart - upstreamWindow);
        const gMax = gMaxBase;
        const totalBp = gMax - gMin;
        const expectedTintW = (upstreamWindow / totalBp) * drawWidth;

        assert.approximately(tintW, expectedTintW, 2);
    });

    it('tint re-anchors on active-transcript change: tint right edge shifts by the TSS delta', () => {
        // Two transcripts with different txStart — the tint should move by the
        // pixel-space difference in TSS positions when the active transcript changes.
        const exonsA = [{ number: 1, start: 1000, end: 2000 }];
        const exonsB = [{ number: 1, start: 1200, end: 2000 }]; // TSS 200bp downstream

        const forteTranscript = makeTranscript({
            transcriptId: 'ENST_FORTE',
            isForteSelected: true,
            strand: '+',
            exons: exonsA,
            txStart: 1000,
            txEnd: 2000,
            utrs: [],
        });
        const userTranscript = makeTranscript({
            transcriptId: 'ENST_USER',
            isForteSelected: false,
            strand: '+',
            exons: exonsB,
            txStart: 1200,
            txEnd: 2000,
            utrs: [],
        });

        // Render with FORTE active
        const wrapperA = mount(
            <svg>
                <GeneTrack
                    symbol="GENE_A"
                    chromosome="1"
                    position={1500}
                    strand="+"
                    siteDescription=""
                    forteTranscript={forteTranscript}
                    userTranscripts={[userTranscript]}
                    color={GENE_COLOR}
                    x={0}
                    y={0}
                    width={400}
                    is5Prime={true}
                    showPromoter={true}
                    activeTranscriptId="ENST_FORTE"
                />
            </svg>
        );

        const tintA = wrapperA.find('[data-testid="promoter-tint"]');
        assert.equal(tintA.length, 1);
        const rightA = Number(tintA.prop('x')) + Number(tintA.prop('width'));

        // Re-render with USER transcript active
        const wrapperB = mount(
            <svg>
                <GeneTrack
                    symbol="GENE_A"
                    chromosome="1"
                    position={1500}
                    strand="+"
                    siteDescription=""
                    forteTranscript={forteTranscript}
                    userTranscripts={[userTranscript]}
                    color={GENE_COLOR}
                    x={0}
                    y={0}
                    width={400}
                    is5Prime={true}
                    showPromoter={true}
                    activeTranscriptId="ENST_USER"
                />
            </svg>
        );

        const tintB = wrapperB.find('[data-testid="promoter-tint"]');
        assert.equal(tintB.length, 1);
        const rightB = Number(tintB.prop('x')) + Number(tintB.prop('width'));

        // USER TSS (1200) is upstream-right of FORTE TSS (1000) on + strand,
        // so tintRight for USER should be greater than for FORTE.
        assert.isAbove(
            rightB,
            rightA,
            'tint right edge should shift rightward when TSS moves right'
        );
    });
});

// ---------------------------------------------------------------------------
// applyUpstreamExtension unit tests
// ---------------------------------------------------------------------------

describe('applyUpstreamExtension', () => {
    it('+ strand extends gMin leftward by upstreamWindow', () => {
        const exons = [{ number: 1, start: 1000, end: 2000 }];
        const { gMin, gMax, upstreamWindow } = applyUpstreamExtension(
            900,
            2100,
            '+',
            exons
        );
        assert.equal(upstreamWindow, Math.min(2000, 0.05 * 1000));
        assert.equal(gMin, Math.min(900, 1000 - upstreamWindow));
        assert.equal(gMax, 2100);
    });

    it('- strand extends gMax rightward by upstreamWindow', () => {
        const exons = [{ number: 1, start: 1000, end: 2000 }];
        const { gMin, gMax, upstreamWindow } = applyUpstreamExtension(
            900,
            2100,
            '-',
            exons
        );
        assert.equal(upstreamWindow, Math.min(2000, 0.05 * 1000));
        assert.equal(gMin, 900);
        assert.equal(gMax, Math.max(2100, 2000 + upstreamWindow));
    });

    it('clamps upstreamWindow to 2000 for large gene span', () => {
        const exons = [{ number: 1, start: 0, end: 200000 }];
        const { upstreamWindow } = applyUpstreamExtension(
            -1000,
            201000,
            '+',
            exons
        );
        assert.equal(upstreamWindow, 2000);
    });
});

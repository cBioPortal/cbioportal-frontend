import { assert } from 'chai';
import { computeRetainedShadeX } from './GeneTrack';

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

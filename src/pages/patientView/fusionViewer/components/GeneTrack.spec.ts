import { assert } from 'chai';
import { computeRetainedShadeX } from './GeneTrack';

describe('computeRetainedShadeX', () => {
    describe('+ strand (retained is left of breakpoint)', () => {
        it('returns x=drawX and width=bpX-drawX', () => {
            const result = computeRetainedShadeX('+', 180, 20, 300);
            assert.equal(result.x, 20);
            assert.equal(result.width, 160);
        });

        it('clamps to 0 when breakpoint is left of drawX', () => {
            const result = computeRetainedShadeX('+', 10, 20, 300);
            assert.equal(result.x, 20);
            assert.equal(result.width, 0);
        });

        it('returns full width when breakpoint is right of track end', () => {
            const result = computeRetainedShadeX('+', 400, 20, 300);
            assert.equal(result.x, 20);
            assert.equal(result.width, 300);
        });
    });

    describe('- strand (retained is right of breakpoint)', () => {
        it('returns x=bpX and width from bpX to track end', () => {
            const result = computeRetainedShadeX('-', 180, 20, 300);
            assert.equal(result.x, 180);
            assert.equal(result.width, 140); // (20 + 300) - 180
        });

        it('clamps to 0 when breakpoint is right of track end', () => {
            const result = computeRetainedShadeX('-', 400, 20, 300);
            assert.equal(result.width, 0);
        });

        it('returns full width when breakpoint is left of drawX', () => {
            const result = computeRetainedShadeX('-', 10, 20, 300);
            assert.equal(result.x, 20); // clamped to drawX
            assert.equal(result.width, 300); // (20 + 300) - 20
        });
    });
});

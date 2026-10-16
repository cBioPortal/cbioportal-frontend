import { assert } from 'chai';
import { calculatePointScale } from './dataUtils';
import { EmbeddingPoint } from '../EmbeddingTypes';

function grid(count: number, extent: number): EmbeddingPoint[] {
    const side = Math.ceil(Math.sqrt(count));
    const points: EmbeddingPoint[] = [];
    for (let i = 0; i < count; i++) {
        points.push({
            x: ((i % side) / (side - 1)) * extent,
            y: (Math.floor(i / side) / (side - 1)) * extent,
        } as EmbeddingPoint);
    }
    return points;
}

describe('calculatePointScale', () => {
    it('leaves a dense map at the reference extent unscaled', () => {
        assert.closeTo(calculatePointScale(grid(50000, 34.5)), 1, 0.01);
    });

    it('grows with the coordinate extent', () => {
        assert.closeTo(calculatePointScale(grid(50000, 69)), 2, 0.01);
    });

    it('grows for sparse maps, by 1/sqrt(point count)', () => {
        assert.closeTo(calculatePointScale(grid(2000, 34.5)), 5, 0.01);
    });

    it('caps the density boost', () => {
        assert.closeTo(calculatePointScale(grid(10, 34.5)), 10, 0.01);
    });

    it('never shrinks points on maps denser than the reference', () => {
        assert.closeTo(calculatePointScale(grid(200000, 34.5)), 1, 0.01);
    });

    it('returns 1 for empty or zero-extent data', () => {
        assert.equal(calculatePointScale([]), 1);
        assert.equal(
            calculatePointScale([{ x: 1, y: 1 } as EmbeddingPoint]),
            1
        );
    });
});

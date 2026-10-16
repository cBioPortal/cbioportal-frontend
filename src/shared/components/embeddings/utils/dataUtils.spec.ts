import { assert } from 'chai';
import {
    calculatePointScale,
    medianNearestNeighborDistance,
} from './dataUtils';
import { EmbeddingPoint } from '../EmbeddingTypes';

const REFERENCE_SPACING = 0.0323;

function grid(count: number, spacing: number, originX = 0): EmbeddingPoint[] {
    const side = Math.ceil(Math.sqrt(count));
    const points: EmbeddingPoint[] = [];
    for (let i = 0; i < count; i++) {
        points.push({
            x: originX + (i % side) * spacing,
            y: Math.floor(i / side) * spacing,
        } as EmbeddingPoint);
    }
    return points;
}

describe('medianNearestNeighborDistance', () => {
    it('measures the spacing of a regular grid', () => {
        assert.closeTo(
            medianNearestNeighborDistance(grid(400, 0.5))!,
            0.5,
            1e-9
        );
    });

    it('ignores duplicate coordinates', () => {
        const points = grid(100, 0.5);
        assert.closeTo(
            medianNearestNeighborDistance([...points, ...points])!,
            0.5,
            1e-9
        );
    });

    it('is undefined without two distinct points', () => {
        assert.isUndefined(medianNearestNeighborDistance([]));
        assert.isUndefined(
            medianNearestNeighborDistance([
                { x: 1, y: 1 } as EmbeddingPoint,
                { x: 1, y: 1 } as EmbeddingPoint,
            ])
        );
    });
});

describe('calculatePointScale', () => {
    it('leaves a map at the reference spacing unscaled', () => {
        assert.closeTo(
            calculatePointScale(grid(50000, REFERENCE_SPACING)),
            1,
            0.01
        );
    });

    it('grows with the spacing between neighbours', () => {
        assert.closeTo(
            calculatePointScale(grid(1000, REFERENCE_SPACING * 18)),
            18,
            0.01
        );
    });

    it('stays small for tight clusters spread over a wide range', () => {
        const clusters = [
            ...grid(300, REFERENCE_SPACING * 2),
            ...grid(300, REFERENCE_SPACING * 2, 100),
        ];
        assert.closeTo(calculatePointScale(clusters), 2, 0.01);
    });

    it('returns 1 for empty or single-point data', () => {
        assert.equal(calculatePointScale([]), 1);
        assert.equal(
            calculatePointScale([{ x: 1, y: 1 } as EmbeddingPoint]),
            1
        );
    });
});

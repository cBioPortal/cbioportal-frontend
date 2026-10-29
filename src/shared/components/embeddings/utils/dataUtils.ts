import { EmbeddingPoint } from '../EmbeddingTypes';

/**
 * Calculate the bounds of the data for centering the view
 */
export function calculateDataBounds(data: EmbeddingPoint[]) {
    if (!data || data.length === 0) {
        return { centerX: 0, centerY: 0, zoom: 0 };
    }

    const xValues = data.map(d => d.x);
    const yValues = data.map(d => d.y);

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate zoom to show all data with padding
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const paddingFactor = 0.9;

    // Use typical dimensions for calculation
    const width = 1200;
    const height = 600;

    const scaleX = rangeX > 0 ? (width * paddingFactor) / rangeX : 1;
    const scaleY = rangeY > 0 ? (height * paddingFactor) / rangeY : 1;
    const scale = Math.min(scaleX, scaleY);
    const zoom = scale > 0 ? Math.log2(scale) : 0;

    return { centerX, centerY, zoom: Math.max(-3, Math.min(10, zoom)) };
}

// Point sizes in layerUtils are in data units, calibrated on the H&E map, whose
// median nearest-neighbour distance is ~0.032. Scaling by a map's own spacing
// keeps neighbouring points about as far apart relative to their size, whatever
// the coordinate range or how tightly the projection packs its clusters.
const REFERENCE_NEIGHBOR_DISTANCE = 0.0323;
const MAX_SAMPLED_POINTS = 1000;

/**
 * Median distance from a point to its nearest distinct neighbour, estimated on
 * an evenly strided sample of at most MAX_SAMPLED_POINTS points.
 */
export function medianNearestNeighborDistance(
    data: { x: number; y: number }[]
): number | undefined {
    const sorted = data
        .filter(d => isFinite(d.x) && isFinite(d.y))
        .sort((a, b) => a.x - b.x);
    if (sorted.length < 2) {
        return undefined;
    }
    const stride = Math.max(1, Math.floor(sorted.length / MAX_SAMPLED_POINTS));
    const distances: number[] = [];
    for (let i = 0; i < sorted.length; i += stride) {
        const p = sorted[i];
        let best = Infinity;
        // Sorted by x, so the scan in each direction stops once dx alone exceeds the best match.
        for (let j = i + 1; j < sorted.length; j++) {
            const dx = sorted[j].x - p.x;
            if (dx >= best) break;
            const dist = Math.hypot(dx, sorted[j].y - p.y);
            if (dist > 0 && dist < best) best = dist;
        }
        for (let j = i - 1; j >= 0; j--) {
            const dx = p.x - sorted[j].x;
            if (dx >= best) break;
            const dist = Math.hypot(dx, sorted[j].y - p.y);
            if (dist > 0 && dist < best) best = dist;
        }
        if (isFinite(best)) {
            distances.push(best);
        }
    }
    if (distances.length === 0) {
        return undefined;
    }
    distances.sort((a, b) => a - b);
    return distances[Math.floor(distances.length / 2)];
}

/**
 * Multiplier for point radius and stroke width, proportional to the map's
 * median nearest-neighbour distance.
 */
export function calculatePointScale(data: { x: number; y: number }[]): number {
    if (!data || data.length === 0) {
        return 1;
    }
    const spacing = medianNearestNeighborDistance(data);
    return spacing === undefined ? 1 : spacing / REFERENCE_NEIGHBOR_DISTANCE;
}

// Points outside the cohort are drawn far smaller than cohort points. On a
// dense map they still add up to a visible backdrop; on a sparse one they
// shrink to specks, so enlarge them as the point count drops.
const CONTEXT_REFERENCE_POINT_COUNT = 50000;
const MAX_CONTEXT_POINT_BOOST = 3;

/**
 * Extra radius multiplier for points outside the cohort: 1 on a map as dense
 * as the H&E one, growing as 1/sqrt(point count) up to MAX_CONTEXT_POINT_BOOST.
 */
export function calculateContextPointBoost(pointCount: number): number {
    if (!(pointCount > 0)) {
        return 1;
    }
    return Math.min(
        MAX_CONTEXT_POINT_BOOST,
        Math.max(1, Math.sqrt(CONTEXT_REFERENCE_POINT_COUNT / pointCount))
    );
}

// Sized to the H&E calibration, points overlap their neighbours. On a dense
// map that reads as density; on a sparse one it hides individual samples, so
// shrink sample points as the point count drops.
const MIN_SPARSE_MAP_POINT_FACTOR = 0.5;

/**
 * Radius multiplier for sample points: 1 on a map as dense as the H&E one,
 * shrinking as the fourth root of the point count down to
 * MIN_SPARSE_MAP_POINT_FACTOR.
 */
export function calculateSparseMapPointFactor(pointCount: number): number {
    if (!(pointCount > 0)) {
        return 1;
    }
    return Math.max(
        MIN_SPARSE_MAP_POINT_FACTOR,
        Math.min(1, Math.pow(pointCount / CONTEXT_REFERENCE_POINT_COUNT, 0.25))
    );
}

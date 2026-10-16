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

// Point sizes in layerUtils are in data units, calibrated on the H&E map
// (~50k points over ~34 units). Keep the same share of the screen per point on
// maps with a wider coordinate range (t-SNE spans ~95) or far fewer points.
const REFERENCE_EXTENT = 34.5;
const REFERENCE_POINT_COUNT = 50000;
const MAX_DENSITY_SCALE = 10;

/**
 * Multiplier for point radius and stroke width: proportional to the data's
 * extent, and to 1/sqrt(point count) so sparse maps get larger points.
 */
export function calculatePointScale(data: EmbeddingPoint[]): number {
    if (!data || data.length === 0) {
        return 1;
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const d of data) {
        minX = Math.min(minX, d.x);
        maxX = Math.max(maxX, d.x);
        minY = Math.min(minY, d.y);
        maxY = Math.max(maxY, d.y);
    }
    const extent = Math.max(maxX - minX, maxY - minY);
    if (!(extent > 0)) {
        return 1;
    }
    const densityScale = Math.min(
        MAX_DENSITY_SCALE,
        Math.max(1, Math.sqrt(REFERENCE_POINT_COUNT / data.length))
    );
    return (extent / REFERENCE_EXTENT) * densityScale;
}

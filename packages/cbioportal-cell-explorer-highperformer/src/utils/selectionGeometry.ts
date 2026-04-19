/**
 * Ray-casting point-in-polygon test.
 * Returns true if the point (x, y) lies inside the polygon.
 */
export function pointInPolygon(
    x: number,
    y: number,
    polygon: [number, number][]
): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0],
            yi = polygon[i][1];
        const xj = polygon[j][0],
            yj = polygon[j][1];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

/**
 * Simplify a polygon using the Ramer-Douglas-Peucker algorithm.
 * Reduces dense lasso traces to a compact set of vertices while preserving shape.
 * If epsilon is omitted, auto-computed as 0.1% of the bounding diagonal.
 */
export function simplifyPolygon(
    polygon: [number, number][],
    epsilon?: number
): [number, number][] {
    if (polygon.length <= 3) return polygon;

    if (epsilon === undefined) {
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
        for (const [x, y] of polygon) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
        const diagonal = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2);
        epsilon = diagonal * 0.001;
    }

    return rdp(polygon, epsilon);
}

function rdp(points: [number, number][], epsilon: number): [number, number][] {
    let maxDist = 0;
    let maxIdx = 0;
    const first = points[0];
    const last = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
        const dist = perpendicularDist(points[i], first, last);
        if (dist > maxDist) {
            maxDist = dist;
            maxIdx = i;
        }
    }

    if (maxDist > epsilon) {
        const left = rdp(points.slice(0, maxIdx + 1), epsilon);
        const right = rdp(points.slice(maxIdx), epsilon);
        return left.slice(0, -1).concat(right);
    }

    return [first, last];
}

function perpendicularDist(
    point: [number, number],
    lineStart: [number, number],
    lineEnd: [number, number]
): number {
    const [px, py] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    return Math.abs(dy * px - dx * py + x2 * y1 - y2 * x1) / Math.sqrt(lenSq);
}

export interface ExpressionStats {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
    q1: number;
    q3: number;
    whiskerLow: number;
    whiskerHigh: number;
    bins: Uint32Array;
    binEdges: Float32Array;
    kdeX: Float32Array;
    kdeDensity: Float32Array;
    clippedCount: number;
}

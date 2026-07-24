export type AlphaFoldPaeData = {
    matrix: number[][];
    maxPae: number;
    length: number;
};

/** AlphaFold DB PAE colormap: low error (confident) → blue, high → orange/red. */
const PAE_COLOR_STOPS: Array<{ t: number; r: number; g: number; b: number }> = [
    { t: 0, r: 0, g: 83, b: 214 },
    { t: 0.35, r: 101, g: 203, b: 243 },
    { t: 0.6, r: 255, g: 219, b: 19 },
    { t: 1, r: 255, g: 125, b: 69 },
];

export function resolveAlphaFoldDocUrl(
    docUrl: string,
    filesBaseUrl?: string
): string {
    if (!filesBaseUrl) {
        return docUrl;
    }

    const match = docUrl.match(
        /^https?:\/\/alphafold\.ebi\.ac\.uk\/files\/(.+)$/i
    );

    if (!match) {
        return docUrl;
    }

    return `${filesBaseUrl.replace(/\/$/, '')}/${match[1]}`;
}

export function parseAlphaFoldPaeJson(data: unknown): AlphaFoldPaeData {
    const entry = Array.isArray(data) ? data[0] : data;

    if (!entry || typeof entry !== 'object') {
        throw new Error('AlphaFold PAE response was empty');
    }

    const matrix = (entry as { predicted_aligned_error?: number[][] })
        .predicted_aligned_error;
    const maxPae = (entry as { max_predicted_aligned_error?: number })
        .max_predicted_aligned_error;

    if (!matrix || matrix.length === 0) {
        throw new Error('AlphaFold PAE response contained no matrix');
    }

    const length = matrix.length;

    if (!matrix.every(row => row.length === length)) {
        throw new Error('AlphaFold PAE matrix must be square');
    }

    if (maxPae == null || !Number.isFinite(maxPae) || maxPae <= 0) {
        let inferredMax = 0;

        matrix.forEach(row => {
            row.forEach(value => {
                if (value > inferredMax) {
                    inferredMax = value;
                }
            });
        });

        return {
            matrix,
            maxPae: inferredMax || 31.75,
            length,
        };
    }

    return { matrix, maxPae, length };
}

export function getAlphaFoldPaeColor(
    value: number,
    maxPae: number
): { r: number; g: number; b: number } {
    const clampedMax = maxPae > 0 ? maxPae : 31.75;
    const t = Math.max(0, Math.min(1, value / clampedMax));

    for (let i = 1; i < PAE_COLOR_STOPS.length; i++) {
        const prev = PAE_COLOR_STOPS[i - 1];
        const next = PAE_COLOR_STOPS[i];

        if (t <= next.t) {
            const localT = (t - prev.t) / (next.t - prev.t || 1);

            return {
                r: Math.round(prev.r + (next.r - prev.r) * localT),
                g: Math.round(prev.g + (next.g - prev.g) * localT),
                b: Math.round(prev.b + (next.b - prev.b) * localT),
            };
        }
    }

    const last = PAE_COLOR_STOPS[PAE_COLOR_STOPS.length - 1];

    return { r: last.r, g: last.g, b: last.b };
}

export function getPaeRowForPosition(
    matrix: number[][],
    position: number
): number[] | null {
    const index = position - 1;

    if (index < 0 || index >= matrix.length) {
        return null;
    }

    return matrix[index];
}

export function formatPaeSummaryForPosition(
    matrix: number[][],
    position: number,
    maxPae: number
): string | null {
    const row = getPaeRowForPosition(matrix, position);

    if (!row) {
        return null;
    }

    const values = row.filter(value => Number.isFinite(value));

    if (values.length === 0) {
        return null;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;

    return `PAE at position ${position}: mean ${mean.toFixed(
        1
    )} Å (min ${min.toFixed(1)}, max ${max.toFixed(
        1
    )} Å; scale 0–${maxPae.toFixed(1)} Å)`;
}

export function formatPaeSummaryForCell(
    matrix: number[][],
    row: number,
    col: number,
    maxPae: number
): string | null {
    const detail = buildPaePairDetail(matrix, row, col, maxPae);

    if (!detail) {
        return null;
    }

    return `PAE (${row}, ${col}): ${detail.paeValue.toFixed(
        1
    )} Å (aligned on ${row}, error for ${col}; scale 0–${maxPae.toFixed(1)} Å)`;
}

export interface PaePairDetail {
    alignedResi: number;
    partnerResi: number;
    paeValue: number;
    maxPae: number;
    lines: string[];
}

export function getPaeCellValue(
    matrix: number[][],
    row: number,
    col: number
): number | null {
    const rowIndex = row - 1;
    const colIndex = col - 1;

    if (
        rowIndex < 0 ||
        colIndex < 0 ||
        rowIndex >= matrix.length ||
        colIndex >= matrix.length
    ) {
        return null;
    }

    const value = matrix[rowIndex][colIndex];

    return Number.isFinite(value) ? value : null;
}

export interface PaeCellSummary {
    i: number;
    j: number;
    paeValue: number;
}

export function getPaeCellSummary(
    matrix: number[][],
    row: number,
    col: number
): PaeCellSummary | null {
    const paeValue = getPaeCellValue(matrix, row, col);

    if (paeValue == null) {
        return null;
    }

    return {
        i: row,
        j: col,
        paeValue,
    };
}

export function buildPaePairDetail(
    matrix: number[][],
    row: number,
    col: number,
    maxPae: number
): PaePairDetail | null {
    const paeValue = getPaeCellValue(matrix, row, col);

    if (paeValue == null) {
        return null;
    }

    const lines =
        row === col
            ? [
                  `Predicted aligned error: ${paeValue.toFixed(1)} Å`,
                  `Same residue (${row}): self-alignment reference.`,
                  `Scale: 0–${maxPae.toFixed(1)} Å (blue = low, orange = high).`,
              ]
            : [
                  `Predicted aligned error: ${paeValue.toFixed(1)} Å`,
                  `Aligned residue ${row}: reference frame for relative position.`,
                  `Partner residue ${col}: position error when aligned on residue ${row}.`,
                  `Scale: 0–${maxPae.toFixed(1)} Å (blue = low, orange = high).`,
              ];

    return {
        alignedResi: row,
        partnerResi: col,
        paeValue,
        maxPae,
        lines,
    };
}

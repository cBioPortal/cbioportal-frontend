// Value-axis helpers for the mRNA tab chart: the log-scale lower bound, log
// tick placement and tick label formatting.

// Fraction of the smallest positive values allowed to fall below the log
// floor. A handful of near-zero values (e.g. 1e-60) would otherwise stretch
// the axis over dozens of decades and squeeze the real data against one edge.
export const LOG_FLOOR_PERCENTILE = 0.01;

// The log axis never spans more than this many decades below the maximum.
export const MAX_LOG_DECADES = 8;

// Upper bound on the number of labelled ticks on a log axis.
export const MAX_LOG_TICKS = 8;

function quantileSorted(sorted: number[], q: number): number {
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    const next = sorted[base + 1];
    return next !== undefined
        ? sorted[base] + rest * (next - sorted[base])
        : sorted[base];
}

// Lower bound for the log scale. Values below it (including zeros) are drawn
// at the bound. It is the larger of:
//  - the smallest positive value,
//  - the LOG_FLOOR_PERCENTILE quantile of the positive values, rounded down to
//    a power of ten,
//  - MAX_LOG_DECADES decades below the largest value.
export function computeLogFloor(values: number[]): number {
    const positives = values
        .filter(v => v > 0 && Number.isFinite(v))
        .sort((a, b) => a - b);
    if (positives.length === 0) {
        return 1;
    }
    const minPositive = positives[0];
    const max = positives[positives.length - 1];
    const lowQuantile = quantileSorted(positives, LOG_FLOOR_PERCENTILE);
    const quantileDecade = Math.pow(10, Math.floor(Math.log10(lowQuantile)));
    const rangeCap = max / Math.pow(10, MAX_LOG_DECADES);
    return Math.max(minPositive, quantileDecade, rangeCap);
}

// Ticks for a log axis over [lo, hi]. Up to two decades get 1-2-5 ticks per
// decade; wider ranges get powers of ten, skipping decades as needed to keep
// at most MAX_LOG_TICKS labels.
export function logValueTicks(lo: number, hi: number): number[] | undefined {
    if (!(lo > 0) || !(hi > lo)) {
        return undefined;
    }
    const startExp = Math.floor(Math.log10(lo));
    const endExp = Math.ceil(Math.log10(hi));
    const decades = endExp - startExp;
    const inRange = (v: number) => v >= lo && v <= hi;
    const ticks: number[] = [];
    if (decades <= 2) {
        for (let e = startExp; e <= endExp; e++) {
            [1, 2, 5].forEach(m => {
                const v = Number((m * Math.pow(10, e)).toPrecision(12));
                if (inRange(v)) {
                    ticks.push(v);
                }
            });
        }
    } else {
        // Count only the powers of ten that fall inside [lo, hi], so the
        // padded ends of the domain don't force decades to be skipped.
        const inRangeCount =
            Math.floor(Math.log10(hi)) - Math.ceil(Math.log10(lo)) + 1;
        const expStep = Math.max(1, Math.ceil(inRangeCount / MAX_LOG_TICKS));
        // Align to multiples of the step so labels land on round exponents
        // (1, 100, 10k rather than 10, 1k, 100k).
        const firstExp = Math.ceil(startExp / expStep) * expStep;
        for (let e = firstExp; e <= endExp; e += expStep) {
            const v = Number(Math.pow(10, e).toPrecision(12));
            if (inRange(v)) {
                ticks.push(v);
            }
        }
    }
    return ticks.length ? ticks : undefined;
}

const SUPERSCRIPT_DIGITS: { [c: string]: string } = {
    '-': '⁻',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
};

function superscript(n: number): string {
    return String(n)
        .split('')
        .map(c => SUPERSCRIPT_DIGITS[c] ?? c)
        .join('');
}

function compact(
    n: number,
    divisor: number,
    suffix: string,
    decimals: number
): string {
    return `${Number((n / divisor).toFixed(decimals))}${suffix}`;
}

function formatTickWithPrecision(t: number, decimals: number): string {
    const abs = Math.abs(t);
    if (abs >= 1e6) {
        return compact(t, 1e6, 'M', decimals);
    }
    if (abs >= 1e3) {
        return compact(t, 1e3, 'k', decimals);
    }
    if (abs >= 1) {
        return t.toLocaleString('en-US', {
            maximumFractionDigits: decimals + 2,
        });
    }
    if (t === 0 || abs >= 0.01) {
        return `${t}`;
    }
    const exp = Math.floor(Math.log10(abs));
    const mantissa = Number((t / Math.pow(10, exp)).toPrecision(decimals + 2));
    return mantissa === 1
        ? `10${superscript(exp)}`
        : `${mantissa}×10${superscript(exp)}`;
}

// Most decimals a k/M tick label will use to tell ticks apart.
const MAX_TICK_DECIMALS = 6;

// Short value-axis tick label: 1.5k, 2M, 0.05, 10⁻⁶, 2×10⁻⁴. Matches Victory's
// tickFormat(tick, index, ticks) signature: when all ticks are given, uses the
// fewest decimals that keep every label distinct (e.g. 1M, 1.005M, 1.01M).
export function formatValueTick(
    t: number,
    _index?: number,
    ticks?: number[]
): string {
    if (ticks && ticks.length > 1) {
        for (let d = 1; d < MAX_TICK_DECIMALS; d++) {
            const labels = ticks.map(x => formatTickWithPrecision(x, d));
            if (new Set(labels).size === labels.length) {
                return formatTickWithPrecision(t, d);
            }
        }
        return formatTickWithPrecision(t, MAX_TICK_DECIMALS);
    }
    return formatTickWithPrecision(t, 1);
}

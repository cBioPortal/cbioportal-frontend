// Calculates the probability of observing the observed counts (a,b,c,d) in a 2x2 contingency table
// given the total count (n) and the factorial of the counts (logFactorial).
function getProbability(
    a: number,
    b: number,
    c: number,
    d: number,
    logFactorial: number[]
): number {
    const n: number = a + b + c + d;
    const p: number =
        logFactorial[a + b] +
        logFactorial[c + d] +
        logFactorial[a + c] +
        logFactorial[b + d] -
        (logFactorial[a] +
            logFactorial[b] +
            logFactorial[c] +
            logFactorial[d] +
            logFactorial[n]);
    return Math.exp(p);
}

// Cumulative p-value for a 2x2 contingency table using Fisher's exact test
export function getCumulativePValue(
    a: number,
    b: number,
    c: number,
    d: number
): number {
    let min: number, i: number;
    const n: number = a + b + c + d;
    let p: number = 0;
    let logFactorial: number[] = new Array(n + 1);
    logFactorial[0] = 0.0;

    for (let j: number = 1; j <= n; j++) {
        logFactorial[j] = logFactorial[j - 1] + Math.log(j);
    }

    // probability for the given contingency table
    p += getProbability(a, b, c, d, logFactorial);
    // cumulative p-value for all tables with greater proportion of observations in 1st row and 1st column
    if (a * d >= b * c) {
        min = c < b ? c : b;
        for (i = 0; i < min; i++) {
            p += getProbability(++a, --b, --c, ++d, logFactorial);
        }
    }

    // cumulative p-value for all tables with greater proportion of observations in 2nd row and 2nd column
    if (a * d < b * c) {
        min = a < d ? a : d;
        for (i = 0; i < min; i++) {
            p += getProbability(--a, ++b, ++c, --d, logFactorial);
        }
    }
    return p;
}
